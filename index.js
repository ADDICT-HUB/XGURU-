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

// --- 0. COMMAND REGISTRY (FIXED: Must be defined before loading plugins) ---
const commands = [];
const evt = (obj, func) => {
    obj.function = func;
    commands.push(obj);
    return obj;
};
evt.commands = commands;
// Export immediately so plugins can see it
module.exports = { evt };

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

        // --- PLUGIN LOADING (FIXED: Load after evt is exported) ---
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

            // Automation: Auto-React
            if (autoReact === "true" && !ms.key.fromMe && typeof GiftedAutoReact === 'function') {
                await GiftedAutoReact(emojis[Math.floor(Math.random() * emojis.length)], ms, Gifted);
            }

            // Message Parsing (FIXED: Added checks for null/undefined body)
            const mtype = getContentType(ms.message);
            const body = (mtype === 'conversation') ? ms.message.conversation : 
                         (mtype === 'extendedTextMessage') ? ms.message.extendedTextMessage.text : 
                         (mtype === 'imageMessage' || mtype === 'videoMessage') ? ms.message[mtype].caption : 
                         (mtype === 'templateButtonReplyMessage') ? ms.message.templateButtonReplyMessage.selectedId :
                         (mtype === 'buttonsResponseMessage') ? ms.message.buttonsResponseMessage.selectedButtonId :
                         (mtype === 'listResponseMessage') ? ms.message.listResponseMessage.singleSelectReply.selectedRowId : '';

            // Check if body exists before using startsWith
            const isCommand = body && body.startsWith(botPrefix);
            const cmdName = isCommand ? body.slice(botPrefix.length).trim().split(' ').shift().toLowerCase() : '';
            const args = body ? body.trim().split(/ +/).slice(1) : [];
            const q = args.join(' ');

            // --- INTEGRATED TABLE COMMANDS (GHOST & KICK) ---
            if (isCommand) {
                if (cmdName === 'ghost') {
                    if (!isSuperUser) return Gifted.sendMessage(from, { text: "❌ *NI MBAYA!* Owner only." }, { quoted: ms });
                    const status = args[0]?.toLowerCase();
                    if (status === 'on' || status === 'off') {
                        const isGhost = status === 'on';
                        await Gifted.sendPresenceUpdate(isGhost ? 'unavailable' : 'available', from);
                        const ghostMsg = `\n╔════════════════════════╗\n  *『 𝐆𝐇𝐎𝐒𝐓 𝐌𝐎𝐃𝐄 𝐒𝐓𝐀𝐓𝐔𝐒 』*\n  \n  ⋄ 𝐒𝐭𝐚𝐭𝐮𝐬   : ${isGhost ? '𝐀𝐂𝐓𝐈𝐕𝐀𝐓𝐄𝐃 👻' : '𝐃𝐄𝐀𝐂𝐓𝐈𝐕𝐀𝐓𝐄𝐃 👁️'}\n  ⋄ 𝐕𝐢𝐬𝐢𝐛𝐢𝐥𝐢𝐭𝐲 : ${isGhost ? '𝐇𝐢𝐝𝐝𝐞𝐧' : '𝐏𝐮𝐛𝐥𝐢𝐜'}\n  ⋄ 𝐍𝐨𝐭𝐞     : 𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅\n╚════════════════════════╝`;
                        return Gifted.sendMessage(from, { text: ghostMsg }, { quoted: ms });
                    }
                }

                if (cmdName === 'kick') {
                    if (!isGroup) return;
                    const groupMetadata = await Gifted.groupMetadata(from);
                    const admins = groupMetadata.participants.filter(p => p.admin).map(p => p.id);
                    if (!admins.includes(sender) && !isSuperUser) return Gifted.sendMessage(from, { text: "❌ Admins only." }, { quoted: ms });
                    let target = ms.message.extendedTextMessage?.contextInfo?.mentionedJid[0] || ms.message.extendedTextMessage?.contextInfo?.participant;
                    if (!target) return Gifted.sendMessage(from, { text: "⚠️ Tag a user to kick." }, { quoted: ms });
                    await Gifted.groupParticipantsUpdate(from, [target], "remove");
                    const kickMsg = `\n╔════════════════════════╗\n  *『 𝐆𝐑𝐎𝐔𝐏 𝐔𝐏𝐃𝐀𝐓𝐄 』*\n  \n  ⋄ 𝐀𝐜𝐭𝐢𝐨𝐧   : 𝐔𝐬𝐞𝐫 𝐊𝐢𝐜𝐤𝐞𝐝 🚫\n  ⋄ 𝐒𝐭𝐚𝐭𝐮𝐬   : 𝐒𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥\n  ⋄ 𝐏𝐨𝐰𝐞𝐫   : 𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅\n╚════════════════════════╝`;
                    return Gifted.sendMessage(from, { text: kickMsg }, { quoted: ms });
                }
            }

            // --- PLUGIN COMMAND EXECUTION ---
            if (isCommand && cmdName && evt.commands) {
                const commandObj = evt.commands.find(c => c.pattern === cmdName || (c.alias && c.alias.includes(cmdName)));
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

        // --- 5. CONNECTION HANDLER ---
        Gifted.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect } = update;
            
            if (connection === "open") {
                console.log("✅ Connection Online - NI MBAYA 😅");
                reconnectAttempts = 0;
                
                if (startMess === 'true') {
                    const totalCommands = evt.commands ? evt.commands.length : 0;
                    const connectionMsg = `\n✨ *𝐗-𝐆𝐔𝐑𝐔 𝐌𝐃 𝐈𝐍𝐓𝐄𝐆𝐑𝐀𝐓𝐄𝐃* ✨\n\n╔════════════════════════╗\n  *『 𝐒𝐘𝐒𝐓𝐄𝐌 𝐈𝐍𝐅𝐎𝐑𝐌𝐀𝐓𝐈𝐎𝐍 』*\n  \n  ⋄ 𝐒𝐭𝐚𝐭𝐮𝐬   : 𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅\n  ⋄ 𝐁𝐨𝐭 𝐍𝐚𝐦𝐞 : ${botName}\n  ⋄ 𝐂𝐦𝐝𝐬     : ${totalCommands}\n  ⋄ 𝐌𝐨𝐝𝐞     : ${botMode}\n╚════════════════════════╝`;

                    await Gifted.sendMessage(Gifted.user.id, {
                        text: connectionMsg,
                        contextInfo: {
                            externalAdReply: {
                                title: "𝐗-𝐆𝐔𝐑𝐔 𝐌𝐃 𝐕𝟓 𝐒𝐔𝐂𝐂𝐄𝐒𝐒",
                                body: "𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅",
                                thumbnailUrl: "https://files.catbox.moe/atpgij.jpg",
                                sourceUrl: newsletterUrl, mediaType: 1, renderLargerThumbnail: true
                            }
                        }
                    });
                }
            }

            if (connection === "close") {
                const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
                const errorStr = lastDisconnect?.error?.toString() || "";

                if (reason === DisconnectReason.badSession || errorStr.includes("Bad MAC")) {
                    console.log("❌ CRITICAL: Bad MAC/Session Error. Clearing session...");
                    if (fs.existsSync(sessionDir)) fs.rmSync(sessionDir, { recursive: true, force: true });
                    process.exit(1); 
                } else {
                    reconnectWithRetry();
                }
            }
        });

    } catch (error) {
        console.error('Fatal Socket error:', error);
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
