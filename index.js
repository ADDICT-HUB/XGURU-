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

const { 
    Sticker, 
    createSticker, 
    StickerTypes 
} = require("wa-sticker-formatter");
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
            browser: ['X-GURU', "safari", "1.0.0"],
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger)
            },
            getMessage: async (key) => {
                if (store) {
                    const msg = store.loadMessage(key.remoteJid, key.id);
                    return msg?.message || undefined;
                }
                return { conversation: 'Error occurred' };
            },
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 60000,
            keepAliveIntervalMs: 10000,
            markOnlineOnConnect: true,
            syncFullHistory: false,
            generateHighQualityLinkPreview: false,
            patchMessageBeforeSending: (message) => {
                const requiresPatch = !!(
                    message.buttonsMessage ||
                    message.templateMessage ||
                    message.listMessage
                );
                if (requiresPatch) {
                    message = {
                        viewOnceMessage: {
                            message: {
                                messageContextInfo: {
                                    deviceListMetadataVersion: 2,
                                    deviceListMetadata: {},
                                },
                                ...message,
                            },
                        },
                    };
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

        if (autoReact === "true") {
            Gifted.ev.on('messages.upsert', async (mek) => {
                ms = mek.messages[0];
                try {
                    if (ms.key.fromMe) return;
                    if (!ms.key.fromMe && ms.message) {
                        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                        await GiftedAutoReact(randomEmoji, ms, Gifted);
                    }
                } catch (err) {
                    console.error('Error during auto reaction:', err);
                }
            });
        }

        const groupCooldowns = new Map();

        function isGroupSpamming(jid) {
            const now = Date.now();
            const lastTime = groupCooldowns.get(jid) || 0;
            if (now - lastTime < 1500) return true;
            groupCooldowns.set(jid, now);
            return false;
        }
        
        let giftech = { chats: {} };

Gifted.ev.on("messages.upsert", async ({ messages }) => {
    try {
        const ms = messages[0];
        if (!ms?.message) return;

        const { key } = ms;
        if (!key?.remoteJid) return;
        if (key.fromMe) return;
        if (key.remoteJid === 'status@broadcast') return;

        const sender = key.senderPn || key.participantPn || key.participant || key.remoteJid;
        const senderPushName = key.pushName || ms.pushName;

        const botJid = `${Gifted.user?.id.split(':')[0]}@s.whatsapp.net`;

        if (sender === botJid || key.fromMe) return;

        if (!giftech.chats[key.remoteJid]) giftech.chats[key.remoteJid] = [];
        giftech.chats[key.remoteJid].push({
            ...ms,
            originalSender: sender, 
            originalPushName: senderPushName,
            timestamp: Date.now()
        });

        if (giftech.chats[key.remoteJid].length > 50) {
            giftech.chats[key.remoteJid] = giftech.chats[key.remoteJid].slice(-50);
        }

        if (ms.message?.protocolMessage?.type === 0) {
            const deletedId = ms.message.protocolMessage.key.id;
            const deletedMsg = giftech.chats[key.remoteJid].find(m => m.key.id === deletedId);
            if (!deletedMsg?.message) return;

            const deleter = key.senderPn || key.participantAlt || key.participantPn || key.remoteJidAlt || key.participant || key.remoteJid;
            const deleterPushName = key.pushName || ms.pushName;
            
            await GiftedAntiDelete(
                Gifted, 
                deletedMsg, 
                key, 
                deleter, 
                deletedMsg.originalSender, 
                `${ownerNumber}@s.whatsapp.net`,
                deleterPushName,
                deletedMsg.originalPushName
            );

            giftech.chats[key.remoteJid] = giftech.chats[key.remoteJid].filter(m => m.key.id !== deletedId);
        }
    } catch (error) {
        logger.error('Anti-delete system error:', error);
    }
});

        if (autoBio === 'true') {
            setTimeout(() => GiftedAutoBio(Gifted), 1000);
            setInterval(() => GiftedAutoBio(Gifted), 1000 * 60); 
        }

        Gifted.ev.on("call", async (json) => {
            await GiftedAnticall(json, Gifted);
        });

    Gifted.ev.on('messages.upsert', async (mek) => {
        try {
       const msg = mek.messages[0];
       if (!msg || !msg?.message) return;
       if (msg?.key?.remoteJid === newsletterJid && msg?.key?.server_id) {
           try {
               const emojiList = ["❤️", "💛", "👍", "❤️", "💜", "😮", "🤍" ,"💙"];
               const emoji = emojiList[Math.floor(Math.random() * emojiList.length)];
               const messageId = msg?.key?.server_id.toString();
               await Gifted.newsletterReactMessage(newsletterJid, messageId, emoji);
           } catch (err) {
               console.error("❌ Failed to react to channel message:", err);
           }
       }
   } catch (err) {
       console.log(err);
   }
}); 

        Gifted.ev.on("messages.upsert", async ({ messages }) => {
            if (messages && messages.length > 0) {
                await GiftedPresence(Gifted, messages[0].key.remoteJid);
            }
        });

        Gifted.ev.on("connection.update", ({ connection }) => {
            if (connection === "open") {
                logger.info("Connection established - updating presence");
                GiftedPresence(Gifted, "status@broadcast");
            }
        });

        if (chatBot === 'true' || chatBot === 'audio') {
            GiftedChatBot(Gifted, chatBot, chatBotMode, createContext, createContext2, googleTTS);
        }
        
        Gifted.ev.on('messages.upsert', async ({ messages }) => {
            const message = messages[0];
            if (!message?.message || message.key.fromMe) return;
            if (antiLink !== 'false') {
                await GiftedAntiLink(Gifted, message, antiLink);
            }
        });

        Gifted.ev.on('messages.upsert', async (mek) => {
      try {
        mek = mek.messages[0];
        if (!mek || !mek.message) return;

        const fromJid = mek.key.participantPn || mek.key.participant || mek.key.remoteJidAlt || mek.key.remoteJid;
        mek.message = (getContentType(mek.message) === 'ephemeralMessage') 
            ? mek.message.ephemeralMessage.message 
            : mek.message;

        if (mek.key && mek.key?.remoteJid === "status@broadcast" && isJidBroadcast(mek.key.remoteJid)) {
            const giftedtech = jidNormalizedUser(Gifted.user.id);

            if (autoReadStatus === "true") {
                await Gifted.readMessages([mek.key, giftedtech]);
            }

            if (autoLikeStatus === "true" && mek.key.participant) {
                const emojis = statusLikeEmojis?.split(',') || "💛,❤️,💜,🤍,💙"; 
                const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)]; 
                await Gifted.sendMessage(
                    mek.key.remoteJid,
                    { react: { key: mek.key, text: randomEmoji } },
                    { statusJidList: [mek.key.participant, giftedtech] }
                );
            }

            if (autoReplyStatus === "true") {
                if (mek.key.fromMe) return;
                const customMessage = statusReplyText || '✅ Status Viewed By Gifted-Md';
                await Gifted.sendMessage(
                    fromJid,
                    { text: customMessage },
                    { quoted: mek }
                );
            }
        }
    } catch (error) {
        console.error("Error Processing Actions:", error);
    }
});

         try {
            const pluginsPath = path.join(__dirname, "gifted");
            fs.readdirSync(pluginsPath).forEach((fileName) => {
                if (path.extname(fileName).toLowerCase() === ".js") {
                    try {
                        require(path.join(pluginsPath, fileName));
                    } catch (e) {
                        console.error(`❌ Failed to load ${fileName}: ${e.message}`);
                    }
                }
            });
        } catch (error) {
            console.error("❌ Error reading Taskflow folder:", error.message);
        }

        Gifted.ev.on("messages.upsert", async ({ messages }) => {
            const ms = messages[0];
            if (!ms?.message || !ms?.key) return;

            function standardizeJid(jid) {
                if (!jid) return '';
                try {
                    jid = typeof jid === 'string' ? jid : (jid.decodeJid ? jid.decodeJid() : String(jid));
                    jid = jid.split(':')[0].split('/')[0];
                    if (!jid.includes('@')) {
                        jid += '@s.whatsapp.net';
                    }
                    return jid.toLowerCase();
                } catch (e) { return ''; }
            }

            const botId = standardizeJid(Gifted.user?.id);
            const from = standardizeJid(ms.key.remoteJid);
            const isGroup = from.endsWith("@g.us");
            let groupInfo = null;
            let groupName = '';
            try {
                groupInfo = isGroup ? await Gifted.groupMetadata(from).catch(() => null) : null;
                groupName = groupInfo?.subject || '';
            } catch (err) {}

            const sendr = ms.key.fromMe 
                ? botId 
                : (ms.key.participant || ms.key.remoteJid);
            
            let participants = [];
            let groupAdmins = [];
            let sender = sendr;
            let isBotAdmin = false;
            let isAdmin = false;

            if (groupInfo && groupInfo.participants) {
                participants = groupInfo.participants.map(p => p.id);
                groupAdmins = groupInfo.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin').map(p => p.id);
                isAdmin = groupAdmins.includes(sender);
                isBotAdmin = groupAdmins.includes(botId);
            }

            const type = getContentType(ms.message);
            const pushName = ms.pushName || 'User';
            const body = (type === 'conversation') ? ms.message.conversation : (type === 'extendedTextMessage') ? ms.message.extendedTextMessage.text : (ms.message[type]?.caption) || '';
            const isCommand = body.startsWith(botPrefix);
            const command = isCommand ? body.slice(botPrefix.length).trim().split(' ').shift().toLowerCase() : '';
            const args = body.trim().split(/\s+/).slice(1);

            const isSuperUser = sender.includes(ownerNumber.replace(/\D/g, '')) || ms.key.fromMe;

            if (isCommand) {
                const gmd = evt.commands.find((c) => (c.pattern === command || (c.aliases && c.aliases.includes(command))));

                if (gmd) {
                    if (botMode === "private" && !isSuperUser) return;

                    try {
                        const reply = (teks) => {
                            Gifted.sendMessage(from, { text: teks }, { quoted: ms });
                        };

                        const react = (emoji) => {
                            Gifted.sendMessage(from, { react: { key: ms.key, text: emoji } });
                        };

                        const conText = {
                            m: ms,
                            Gifted,
                            arg: args,
                            q: args.join(" "),
                            sender,
                            pushName,
                            isGroup,
                            groupName,
                            isAdmin,
                            isBotAdmin,
                            isOwner: isSuperUser, // Restores owner access
                            reply,
                            react,
                            config,
                            botName,
                            botPrefix,
                            botPic,
                            botVersion,
                            ownerNumber,
                            from
                        };

                        await gmd.function(from, Gifted, conText);

                    } catch (error) {
                        console.error(`Command error:`, error);
                    }
                }
            }
        });

        Gifted.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect } = update;
            
            if (connection === "connecting") console.log("🕗 Connecting Bot...");

            if (connection === "open") {
                console.log("✅ X-GURU CONNECTED");
                reconnectAttempts = 0;
                
                setTimeout(async () => {
                    try {
                        const totalCommands = evt.commands.length;
                        if (startMess === 'true') {
                            // RESTORED TO PRECISE FIRST STYLE
                            const connectionMsg = `*X GURU CONNECTED*\n\n*Prefix :* [ ${botPrefix} ]\n*Plugins :* ${totalCommands}\n*Mode :* ${botMode}\n*Owner :* ${ownerNumber}\n\n| © 2025 X GURU\n| NI MBAYA 🤩`;

                            await Gifted.sendMessage(Gifted.user.id, { text: connectionMsg });
                        }
                    } catch (err) { console.error(err); }
                }, 5000);
            }

            if (connection === "close") {
                const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
                if (reason === DisconnectReason.loggedOut) {
                    process.exit(1);
                } else {
                    setTimeout(() => reconnectWithRetry(), RECONNECT_DELAY);
                }
            }
        });

        process.on('SIGINT', () => store?.destroy());

    } catch (error) {
        setTimeout(() => reconnectWithRetry(), RECONNECT_DELAY);
    }
}

async function reconnectWithRetry() {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) process.exit(1);
    reconnectAttempts++;
    setTimeout(startGifted, RECONNECT_DELAY);
}

startGifted();
