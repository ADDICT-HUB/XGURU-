const express = require('express');
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const {
    default: giftedConnect,
    useMultiFileAuthState,
    fetchLatestWaWebVersion,
    makeCacheableSignalKeyStore,
    DisconnectReason,
    jidNormalizedUser,
    getContentType
} = require("@whiskeysockets/baileys");

const config = require('./config'); 
const logger = pino({ level: "silent" });

// --- 0. GLOBAL COMMAND REGISTRY (FIXED: Global scope for plugins) ---
global.commands = [];
global.evt = (obj, func) => {
    obj.function = func;
    global.commands.push(obj);
    return obj;
};

// --- 1. SAFETY MODULE LOADING ---
let gmdFunctions = {};
try { gmdFunctions = require('./gift/gmdFunctions'); } catch (e) { console.log("⚠️ gift/gmdFunctions.js missing"); }

let gmdStore;
try { gmdStore = require('./gift/store'); } catch (e) { console.log("⚠️ gift/store.js missing"); }

const { 
    gmdBuffer, gmdJson, uploadToCatbox, getMediaBuffer, GiftedTechApi,
    GiftedAutoBio, GiftedAnticall, GiftedAntiDelete, GiftedAutoReact 
} = gmdFunctions;

const {
    MODE: botMode, 
    BOT_NAME: botName, 
    PREFIX: botPrefix,
    PRESENCE: botPresence,
    STARTING_MESSAGE: startMess,
    ANTIDELETE: antiDelete,
    ANTILINK: antiLink,
    ANTICALL: antiCall,
    NEWSLETTER_URL: newsletterUrl,
    NEWSLETTER_JID: newsletterJid,
    GC_JID: groupJid,
    AUTO_REACT: autoReact,
    AUTO_READ_STATUS: autoReadStatus,
    AUTO_LIKE_STATUS: autoLikeStatus,
    STATUS_LIKE_EMOJIS: statusLikeEmojis,
    AUTO_BIO: autoBio,
    CAPTION: botCaption,
    OWNER_NUMBER: ownerNumber
} = config;

const PORT = process.env.PORT || 4420;
const app = express();
let Gifted;
let store; 
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 50;
const RECONNECT_DELAY = 5000;
const emojis = ["❤️", "✨", "🔥", "⚡", "🤖"];

// --- 2. SESSION LOADING ---
const sessionDir = path.join(__dirname, "gift", "session");

async function loadSession() {
    if (!config.SESSION_ID) return console.log("❌ SESSION_ID Missing");
    try {
        if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });
        const sessData = config.SESSION_ID.split('Xguru~')[1] || config.SESSION_ID;
        const decoded = Buffer.from(sessData, 'base64');
        const unzipped = zlib.gunzipSync(decoded);
        fs.writeFileSync(path.join(sessionDir, 'creds.json'), unzipped);
        console.log("✅ SESSION_ID loaded successfully.");
    } catch (e) {
        console.log("❌ CRITICAL ERROR: Session decode failed -> " + e.message);
    }
}

// --- 3. SERVER ---
app.use(express.static("gift"));
app.get("/", (req, res) => {
    const htmlPath = path.join(__dirname, "gift", "gifted.html");
    if (fs.existsSync(htmlPath)) res.sendFile(htmlPath);
    else res.send("🚀 SERVER ONLINE | NI MBAYA 😅");
});
app.listen(PORT, "0.0.0.0", () => {
    console.log("🚀 SERVER ONLINE | NI MBAYA 😅");
    console.log("📝 NOTE [2025-12-27]: Use my note in every script.");
});

// --- 4. MAIN BOT ENGINE ---
async function startGifted() {
    try {
        await loadSession(); 
        const { version } = await fetchLatestWaWebVersion();
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        
        if (store && typeof store.destroy === 'function') store.destroy();
        if (gmdStore) store = new gmdStore();
        
        Gifted = giftedConnect({
            version,
            logger: pino({ level: "silent" }),
            browser: ['X-GURU MD', "Safari", "1.0.0"],
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger)
            },
            getMessage: async (key) => {
                if (store && typeof store.loadMessage === 'function') {
                    const msg = store.loadMessage(key.remoteJid, key.id);
                    return msg?.message || undefined;
                }
                return { conversation: 'NI MBAYA 😅' };
            },
        });

        if (store && Gifted.ev) store.bind(Gifted.ev);
        Gifted.ev.on('creds.update', saveCreds);

        // --- PLUGIN LOADING ---
        const pluginsPath = path.join(__dirname, "gifted");
        if (fs.existsSync(pluginsPath)) {
            fs.readdirSync(pluginsPath).forEach(file => { 
                if (file.endsWith(".js")) {
                    try { require(path.join(pluginsPath, file)); } 
                    catch (e) { console.log(`❌ Error loading plugin ${file}:`, e.message); }
                }
            });
        }

        // --- MESSAGE & AUTOMATION HANDLER ---
        Gifted.ev.on("messages.upsert", async ({ messages }) => {
            const ms = messages[0];
            if (!ms?.message) return;
            const from = ms.key.remoteJid;
            const isGroup = from.endsWith("@g.us");
            const botId = jidNormalizedUser(Gifted.user.id);
            const sender = isGroup ? (ms.key.participant || ms.key.remoteJid) : ms.key.remoteJid;
            const isSuperUser = [ownerNumber, botId.split('@')[0]].some(v => sender.includes(v));

            if (autoReact === "true" && !ms.key.fromMe && typeof GiftedAutoReact === 'function') {
                await GiftedAutoReact(emojis[Math.floor(Math.random() * emojis.length)], ms, Gifted);
            }

            const mtype = getContentType(ms.message);
            const body = (mtype === 'conversation') ? ms.message.conversation : (mtype === 'extendedTextMessage') ? ms.message.extendedTextMessage.text : (mtype === 'imageMessage' || mtype === 'videoMessage') ? ms.message[mtype].caption : '';
            const isCommand = body && body.startsWith(botPrefix);
            const cmdName = isCommand ? body.slice(botPrefix.length).trim().split(' ').shift().toLowerCase() : '';
            const args = body ? body.trim().split(/ +/).slice(1) : [];
            const q = args.join(' ');

            // --- INTEGRATED TABLE COMMANDS ---
            if (isCommand) {
                if (cmdName === 'ghost') {
                    if (!isSuperUser) return;
                    const status = args[0]?.toLowerCase();
                    if (status === 'on' || status === 'off') {
                        const isGhost = status === 'on';
                        await Gifted.sendPresenceUpdate(isGhost ? 'unavailable' : 'available', from);
                        return Gifted.sendMessage(from, { text: `\n╔════════════════════════╗\n  *『 𝐆𝐇𝐎𝐒𝐓 𝐌𝐎𝐃𝐄 』*\n  ⋄ 𝐒𝐭𝐚𝐭𝐮𝐬: ${isGhost ? '𝐎𝐍' : '𝐎𝐅𝐅'}\n╚════════════════════════╝` });
                    }
                }
            }

            // --- PLUGIN COMMAND EXECUTION ---
            if (isCommand && cmdName && global.commands) {
                const commandObj = global.commands.find(c => c.pattern === cmdName || (c.alias && c.alias.includes(cmdName)));
                if (commandObj && typeof commandObj.function === 'function') {
                    const conText = {
                        m: ms, Gifted, from, sender, isGroup, body, command: cmdName, 
                        args: args, q: q, isSuperUser,
                        reply: (text) => Gifted.sendMessage(from, { text }, { quoted: ms }),
                        react: (emoji) => Gifted.sendMessage(from, { react: { key: ms.key, text: emoji } }),
                        getMediaBuffer, gmdBuffer, gmdJson, uploadToCatbox, GiftedTechApi
                    };
                    await commandObj.function(from, Gifted, conText);
                }
            }
        });

        // --- 5. CONNECTION HANDLER (FIXES LOG ERRORS) ---
        Gifted.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect } = update;
            
            if (connection === "open") {
                console.log("✅ Connection Online - NI MBAYA 😅");
                reconnectAttempts = 0;
            }

            if (connection === "close") {
                const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
                const errorStr = lastDisconnect?.error?.toString() || "";

                // Force clear session if Bad MAC occurs (prevents the loop in your logs)
                if (reason === DisconnectReason.badSession || errorStr.includes("Bad MAC") || errorStr.includes("decryption")) {
                    console.log("❌ SESSION CORRUPTED: Purging session files...");
                    if (fs.existsSync(sessionDir)) fs.rmSync(sessionDir, { recursive: true, force: true });
                    process.exit(1); 
                } else {
                    reconnectWithRetry();
                }
            }
        });

    } catch (error) {
        reconnectWithRetry();
    }
}

function reconnectWithRetry() {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) process.exit(1);
    reconnectAttempts++;
    setTimeout(() => startGifted(), RECONNECT_DELAY);
}

startGifted();
