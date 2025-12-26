const { 
    default: giftedConnect, 
    isJidGroup, 
    jidNormalizedUser,
    isJidBroadcast,
    downloadMediaMessage, 
    downloadContentFromMessage,
    downloadAndSaveMediaMessage, 
    DisconnectReason, 
    getContentType,
    fetchLatestWaWebVersion, 
    useMultiFileAuthState, 
    makeCacheableSignalKeyStore,
    jidDecode 
} = require("gifted-baileys");

const { 
    evt, 
    logger,
    emojis,
    gmdStore,
    commands,
    setSudo,
    delSudo,
    GiftedTechApi,
    GiftedApiKey,
    GiftedAutoReact,
    GiftedAntiLink,
    GiftedAutoBio,
    GiftedChatBot,
    loadSession,
    getMediaBuffer,
    getSudoNumbers,
    getFileContentType,
    bufferToStream,
    uploadToPixhost,
    uploadToImgBB,
    setCommitHash, 
    getCommitHash,
    gmdBuffer, gmdJson, 
    formatAudio, formatVideo,
    uploadToGithubCdn,
    uploadToGiftedCdn,
    uploadToPasteboard,
    uploadToCatbox,
    GiftedAnticall,
    createContext, 
    createContext2,
    verifyJidState,
    GiftedPresence,
    GiftedAntiDelete
} = require("./gift");

const { Sticker, createSticker, StickerTypes } = require("wa-sticker-formatter");
const pino = require("pino");
const config = require("./config");
const axios = require("axios");
const googleTTS = require("google-tts-api");
const fs = require("fs-extra");
const path = require("path");
const { Boom } = require("@hapi/boom");
const express = require("express");
const { promisify } = require('util');
const stream = require('stream');
const pipeline = promisify(stream.pipeline);

const {
    MODE: botMode, 
    BOT_PIC: botPic, 
    FOOTER: botFooter, 
    CAPTION: botCaption, 
    VERSION: botVersion, 
    OWNER_NUMBER: ownerNumber, 
    OWNER_NAME: ownerName,  
    BOT_NAME: botName, 
    PREFIX: botPrefix,
    PRESENCE: botPresence,
    CHATBOT: chatBot,
    CHATBOT_MODE: chatBotMode,
    STARTING_MESSAGE: startMess,
    ANTIDELETE: antiDelete,
    ANTILINK: antiLink,
    ANTICALL: antiCall,
    TIME_ZONE: timeZone,
    BOT_REPO: giftedRepo,
    GC_JID: groupJid,
    NEWSLETTER_JID: newsletterJid,
    NEWSLETTER_URL: newsletterUrl,
    AUTO_REACT: autoReact,
    AUTO_READ_STATUS: autoReadStatus,
    AUTO_LIKE_STATUS: autoLikeStatus,
    STATUS_LIKE_EMOJIS: statusLikeEmojis,
    AUTO_REPLY_STATUS: autoReplyStatus,
    STATUS_REPLY_TEXT: statusReplyText,
    AUTO_READ_MESSAGES: autoRead,
    AUTO_BLOCK: autoBlock,
    AUTO_BIO: autoBio } = config;

const PORT = process.env.PORT || 4420;
const app = express();
let Gifted;

logger.level = "silent";

app.use(express.static("gift"));
app.get("/", (req, res) => res.sendFile(__dirname + "/gift/gifted.html"));
app.listen(PORT, () => console.log(`Server Running on Port: ${PORT}`));

const sessionDir = path.join(__dirname, "gift", "session");

loadSession();

let store; 
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 50;
const RECONNECT_DELAY = 5000;

async function startGifted() {
    try {
        const { version, isLatest } = await fetchLatestWaWebVersion();
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        
        if (store) {
            store.destroy();
        }
        store = new gmdStore();
        
        const giftedSock = {
            version,
            logger: pino({ level: "silent" }),
            browser: ['X-GURU', "Chrome", "1.0.0"],
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" }))
            },
            getMessage: async (key) => {
                if (store) {
                    const msg = store.loadMessage(key.remoteJid, key.id);
                    return msg?.message || undefined;
                }
                return { conversation: 'X-Guru Engine Error' };
            },
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 60000,
            keepAliveIntervalMs: 10000,
            markOnlineOnConnect: true,
            syncFullHistory: false,
            generateHighQualityLinkPreview: false,
            patchMessageBeforeSending: (message) => {
                const requiresPatch = !!(message.buttonsMessage || message.templateMessage || message.listMessage);
                if (requiresPatch) {
                    return { viewOnceMessage: { message: { messageContextInfo: { deviceListMetadataVersion: 2, deviceListMetadata: {}, }, ...message, }, }, };
                }
                return message;
            }
        };

        Gifted = giftedConnect(giftedSock);
        store.bind(Gifted.ev);

        Gifted.ev.process(async (events) => {
            if (events['creds.update']) {
                await saveCreds();
            }
        });

        // AUTO REACT LOGIC
        if (autoReact === "true") {
            Gifted.ev.on('messages.upsert', async (mek) => {
                let ms = mek.messages[0];
                try {
                    if (ms.key.fromMe) return;
                    if (!ms.key.fromMe && ms.message) {
                        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                        await GiftedAutoReact(randomEmoji, ms, Gifted);
                    }
                } catch (err) { console.error('Auto reaction error:', err); }
            });
        }

        // ANTI-DELETE LOGIC
        let giftech = { chats: {} };
        Gifted.ev.on("messages.upsert", async ({ messages }) => {
            try {
                const ms = messages[0];
                if (!ms?.message || !ms?.key?.remoteJid || ms.key.fromMe) return;
                if (ms.key.remoteJid === 'status@broadcast') return;

                const sender = ms.key.participant || ms.key.remoteJid;
                if (!giftech.chats[ms.key.remoteJid]) giftech.chats[ms.key.remoteJid] = [];
                giftech.chats[ms.key.remoteJid].push({ ...ms, originalSender: sender, timestamp: Date.now() });

                if (ms.message?.protocolMessage?.type === 0) {
                    const deletedId = ms.message.protocolMessage.key.id;
                    const deletedMsg = giftech.chats[ms.key.remoteJid].find(m => m.key.id === deletedId);
                    if (deletedMsg) {
                        await GiftedAntiDelete(Gifted, deletedMsg, ms.key, sender, deletedMsg.originalSender, ownerNumber + "@s.whatsapp.net");
                    }
                }
            } catch (e) { console.log("Anti-Delete Error", e); }
        });

        // AUTO BIO
        if (autoBio === 'true') {
            setInterval(() => GiftedAutoBio(Gifted), 60000);
        }

        // ANTI-CALL
        Gifted.ev.on("call", async (json) => { await GiftedAnticall(json, Gifted); });

        // CONNECTION UPDATES (FIXED FOR RENDER)
        Gifted.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === "open") {
                console.log("✅ SUCCESS: X-GURU IS ONLINE");
                await Gifted.newsletterFollow(newsletterJid);
                // Send Startup Message
                const msg = `*X-GURU SUPREME CONNECTED*\n\nPrefix: ${botPrefix}\nMode: ${botMode}\nPlugins: ${commands.length}`;
                await Gifted.sendMessage(Gifted.user.id, { text: msg });
            }
            if (connection === "close") {
                const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
                console.log("Connection closed. Reason:", reason);
                if (reason === DisconnectReason.connectionReplaced || reason === 440) {
                    console.log("Conflict detected. Waiting 10s...");
                    setTimeout(() => startGifted(), 10000);
                } else if (reason !== DisconnectReason.loggedOut) {
                    startGifted();
                }
            }
        });

        // MAIN COMMAND HANDLER
        Gifted.ev.on("messages.upsert", async ({ messages }) => {
            const ms = messages[0];
            if (!ms?.message) return;

            const from = ms.key.remoteJid;
            const type = getContentType(ms.message);
            const body = (type === 'conversation') ? ms.message.conversation : 
                         (type === 'extendedTextMessage') ? ms.message.extendedTextMessage.text : 
                         (ms.message[type]?.caption) || '';

            const isCmd = body.startsWith(botPrefix);
            const command = isCmd ? body.slice(botPrefix.length).trim().split(' ').shift().toLowerCase() : '';
            const args = body.trim().split(/ +/).slice(1);
            const q = args.join(" ");

            // SENDER & OWNER DETECTION (FIXED)
            const senderJid = ms.key.participant || ms.key.remoteJid;
            const senderNumber = senderJid.replace(/[^0-9]/g, '');
            const cleanOwner = ownerNumber.replace(/[^0-9]/g, '');
            const isSuperUser = senderNumber === cleanOwner || ms.key.fromMe;

            if (isCmd && command) {
                const cmd = commands.find(c => c.pattern === command || (c.aliases && c.aliases.includes(command)));
                if (cmd) {
                    if (botMode === "private" && !isSuperUser) return;
                    
                    try {
                        const reply = (text) => Gifted.sendMessage(from, { text }, { quoted: ms });
                        const react = (emoji) => Gifted.sendMessage(from, { react: { key: ms.key, text: emoji } });
                        
                        await cmd.function(from, Gifted, {
                            m: ms, q, args, isCmd, command, reply, react, isSuperUser, sender: senderJid, pushName: ms.pushName, botPrefix
                        });
                    } catch (e) {
                        console.error("Command Error:", e);
                        Gifted.sendMessage(from, { text: `❌ Error: ${e.message}` });
                    }
                }
            }
        });

        // Load Taskflow/Plugins
        const pluginsPath = path.join(__dirname, "gifted");
        if (fs.existsSync(pluginsPath)) {
            fs.readdirSync(pluginsPath).forEach(file => {
                if (file.endsWith(".js")) require(path.join(pluginsPath, file));
            });
        }

    } catch (e) {
        console.log("Startup Error:", e);
        setTimeout(() => startGifted(), 5000);
    }
}

startGifted();
