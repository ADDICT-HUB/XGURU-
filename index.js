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

// --- 0. SAFETY MODULE LOADING ---
// This prevents the bot from crashing if your 'gift' folder files are missing
let gmdFunctions = {};
try { gmdFunctions = require('./gift/gmdFunctions'); } catch (e) { console.log("⚠️ gift/gmdFunctions.js missing"); }

let evt = { commands: [] };
try { evt = require('./gift/events'); } catch (e) { console.log("⚠️ gift/events.js missing"); }

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

// --- 1. SESSION LOADING ---
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

// --- 2. SERVER ---
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

// --- 3. MAIN BOT ---
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
            browser: ['GIFTED-MD', "safari", "1.0.0"],
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
                    try { require(path.join(pluginsPath, file)); } catch (e) { console.log(`❌ Error loading plugin ${file}:`, e.message); }
                }
            });
        }

        // --- COMMAND & AUTOMATION HANDLER ---
        Gifted.ev.on("messages.upsert", async ({ messages }) => {
            const ms = messages[0];
            if (!ms?.message) return;
            const from = ms.key.remoteJid;
            const isGroup = from.endsWith("@g.us");
            const botId = jidNormalizedUser(Gifted.user.id);
            const sender = isGroup ? (ms.key.participant || ms.key.remoteJid) : ms.key.remoteJid;

            // Automation: Auto-React
            if (autoReact === "true" && !ms.key.fromMe && typeof GiftedAutoReact === 'function') {
                await GiftedAutoReact(emojis[Math.floor(Math.random() * emojis.length)], ms, Gifted);
            }

            // Command Logic
            const body = (getContentType(ms.message) === 'conversation') ? ms.message.conversation : (ms.message.extendedTextMessage) ? ms.message.extendedTextMessage.text : '';
            const isCommand = body.startsWith(botPrefix);
            const cmdName = isCommand ? body.slice(botPrefix.length).trim().split(' ').shift().toLowerCase() : '';

            if (isCommand && cmdName && evt.commands) {
                const commandObj = evt.commands.find(c => c.pattern === cmdName || (c.alias && c.alias.includes(cmdName)));
                if (commandObj && typeof commandObj.function === 'function') {
                    const conText = {
                        m: ms, Gifted, from, sender, isGroup, body, command: cmdName, 
                        args: body.trim().split(/ +/).slice(1),
                        reply: (text) => Gifted.sendMessage(from, { text }, { quoted: ms }),
                        react: (emoji) => Gifted.sendMessage(from, { react: { key: ms.key, text: emoji } }),
                        getMediaBuffer, gmdBuffer, gmdJson, uploadToCatbox, GiftedTechApi
                    };
                    await commandObj.function(from, Gifted, conText);
                }
            }
        });

        // --- CONNECTION HANDLER ---
        Gifted.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect } = update;
            
            if (connection === "open") {
                console.log("✅ Connection Online");
                reconnectAttempts = 0;
                
                if (startMess === 'true') {
                    const totalCommands = evt.commands ? evt.commands.length : 0;
                    const md = botMode === 'public' ? "Public" : "Private";
                    
                    const connectionMsg = `
✨ *𝐗-𝐆𝐔𝐑𝐔 𝐌𝐃 𝐈𝐍𝐓𝐄𝐆𝐑𝐀𝐓𝐄𝐃* ✨

╔════════════════════════╗
  *『 𝐒𝐘𝐒𝐓𝐄𝐌 𝐈𝐍𝐅𝐎𝐑𝐌𝐀𝐓𝐈𝐎𝐍 』*
  
  ⋄ 𝐒𝐭𝐚𝐭𝐮𝐬   : 𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅
  ⋄ 𝐁𝐨𝐭 𝐍𝐚𝐦𝐞 : ${botName}
  ⋄ 𝐂𝐦𝐝𝐬     : ${totalCommands}
  ⋄ 𝐌𝐨𝐝𝐞     : ${md}
╚════════════════════════╝`;

                    await Gifted.sendMessage(Gifted.user.id, {
                        text: connectionMsg,
                        contextInfo: {
                            externalAdReply: {
                                title: "𝐗-𝐆𝐔𝐑𝐔 𝐌𝐃 𝐕𝟓 𝐒𝐔𝐂𝐂𝐄𝐒𝐒",
                                body: "𝐉𝐨𝐢𝐧 𝐎𝐮𝐫 𝐎𝐟𝐟𝐢𝐜𝐢𝐚𝐥 𝐂𝐡𝐚𝐧𝐧𝐞𝐥 📢",
                                thumbnailUrl: "https://files.catbox.moe/atpgij.jpg",
                                sourceUrl: newsletterUrl, mediaType: 1, renderLargerThumbnail: true
                            }
                        }
                    });
                }
            }

            if (connection === "close") {
                const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
                if (reason === DisconnectReason.badSession || reason === DisconnectReason.loggedOut) {
                    process.exit(1);
                } else {
                    reconnectWithRetry();
                }
            }
        });

    } catch (error) {
        console.error('Socket error:', error);
        reconnectWithRetry();
    }
}

async function reconnectWithRetry() {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) process.exit(1);
    reconnectAttempts++;
    const delay = Math.min(RECONNECT_DELAY * Math.pow(2, reconnectAttempts - 1), 300000);
    setTimeout(() => startGifted(), delay);
}

startGifted();
