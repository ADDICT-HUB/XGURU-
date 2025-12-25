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
    AUTO_TYPING: autoTyping,
    AUTO_RECORDING: autoRecording,
    WELCOME_MESSAGE: welcomeMsg,
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
            browser: ['Gifted-Md', "safari", "2.0.0"],
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger)
            },
            getMessage: async (key) => {
                if (store) {
                    const msg = store.loadMessage(key.remoteJid, key.id);
                    return msg?.message || undefined;
                }
                return { conversation: 'Message history unavailable' };
            },
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 60000,
            keepAliveIntervalMs: 10000,
            markOnlineOnConnect: true,
            syncFullHistory: false,
            generateHighQualityLinkPreview: true,
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

        // --- GROUP PARTICIPANT HANDLER ---
        Gifted.ev.on('group-participants.update', async (anu) => {
            if (welcomeMsg !== "true") return;
            try {
                let metadata = await Gifted.groupMetadata(anu.id);
                let participants = anu.participants;
                for (let num of participants) {
                    let ppuser;
                    try {
                        ppuser = await Gifted.profilePictureUrl(num, 'image');
                    } catch {
                        ppuser = botPic;
                    }
                    if (anu.action == 'add') {
                        let welcomeText = `Hello @${num.split("@")[0]}, Welcome to *${metadata.subject}*!\n\n${metadata.desc || 'Enjoy your stay!'}`;
                        await Gifted.sendMessage(anu.id, { image: { url: ppuser }, caption: welcomeText, mentions: [num] });
                    }
                }
            } catch (err) { console.error("Welcome Error:", err); }
        });

        // --- AUTO REACTION HANDLER ---
        if (autoReact === "true") {
            Gifted.ev.on('messages.upsert', async (mek) => {
                const ms = mek.messages[0];
                if (!ms?.message || ms.key.fromMe) return;
                try {
                    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                    await GiftedAutoReact(randomEmoji, ms, Gifted);
                } catch (err) { console.error('Auto reaction error:', err); }
            });
        }

        // --- ANTI-DELETE & CHAT TRACKING ---
        let giftech = { chats: {} };
        const botJid = `${Gifted.user?.id.split(':')[0]}@s.whatsapp.net`;
        const botOwnerJid = `${ownerNumber}@s.whatsapp.net`;

        Gifted.ev.on("messages.upsert", async ({ messages }) => {
            try {
                const ms = messages[0];
                if (!ms?.message) return;

                const { key } = ms;
                if (!key?.remoteJid || key.remoteJid === 'status@broadcast' || key.fromMe) return;

                const sender = key.participant || key.remoteJid;
                const senderPushName = ms.pushName || 'User';

                if (!giftech.chats[key.remoteJid]) giftech.chats[key.remoteJid] = [];
                giftech.chats[key.remoteJid].push({
                    ...ms,
                    originalSender: sender, 
                    originalPushName: senderPushName,
                    timestamp: Date.now()
                });

                if (giftech.chats[key.remoteJid].length > 50) giftech.chats[key.remoteJid].shift();

                if (ms.message?.protocolMessage?.type === 0 && antiDelete === 'true') {
                    const deletedId = ms.message.protocolMessage.key.id;
                    const deletedMsg = giftech.chats[key.remoteJid].find(m => m.key.id === deletedId);
                    if (!deletedMsg) return;

                    await GiftedAntiDelete(
                        Gifted, 
                        deletedMsg, 
                        key, 
                        sender, 
                        deletedMsg.originalSender, 
                        botOwnerJid,
                        senderPushName,
                        deletedMsg.originalPushName
                    );
                }
            } catch (error) { logger.error('Anti-delete error:', error); }
        });

        // --- SYSTEM AUTOMATIONS (BIO, CALL, NEWSLETTER) ---
        if (autoBio === 'true') {
            setInterval(() => GiftedAutoBio(Gifted), 60000); 
        }

        Gifted.ev.on("call", async (json) => {
            if (antiCall === 'true') await GiftedAnticall(json, Gifted);
        });

        Gifted.ev.on('messages.upsert', async (mek) => {
            const msg = mek.messages[0];
            if (!msg?.message || msg.key.remoteJid !== newsletterJid) return;
            try {
                const emojiList = ["❤️", "👍", "🔥", "🙌", "💙"]; 
                const emoji = emojiList[Math.floor(Math.random() * emojiList.length)];
                if (msg.key.server_id) await Gifted.newsletterReactMessage(newsletterJid, msg.key.server_id.toString(), emoji);
            } catch (err) { console.error("Newsletter Reaction Fail:", err); }
        });

        // --- STATUS & PRESENCE HANDLER ---
        Gifted.ev.on('messages.upsert', async (mek) => {
            try {
                const ms = mek.messages[0];
                if (!ms || !ms.message) return;

                if (ms.key && ms.key.remoteJid === "status@broadcast") {
                    const myJid = jidNormalizedUser(Gifted.user.id);
                    if (autoReadStatus === "true") await Gifted.readMessages([ms.key, myJid]);

                    if (autoLikeStatus === "true" && ms.key.participant) {
                        const emojisArr = statusLikeEmojis?.split(',') || ["❤️", "🔥", "🙌"]; 
                        const randomEmoji = emojisArr[Math.floor(Math.random() * emojisArr.length)]; 
                        await Gifted.sendMessage(ms.key.remoteJid, { react: { key: ms.key, text: randomEmoji } }, { statusJidList: [ms.key.participant, myJid] });
                    }

                    if (autoReplyStatus === "true" && !ms.key.fromMe) {
                        const customMessage = statusReplyText || '✅ Status Viewed';
                        await Gifted.sendMessage(ms.key.participant || ms.key.remoteJid, { text: customMessage }, { quoted: ms });
                    }
                }
            } catch (error) { console.error("Status automation error:", error); }
        });

        // --- LOAD PLUGINS ---
        try {
            const pluginsPath = path.join(__dirname, "gifted");
            if (fs.existsSync(pluginsPath)) {
                fs.readdirSync(pluginsPath).forEach((fileName) => {
                    if (path.extname(fileName).toLowerCase() === ".js") {
                        require(path.join(pluginsPath, fileName));
                    }
                });
            }
        } catch (error) { console.error("Plugin loading error:", error.message); }

        // --- COMMAND HANDLER ---
        Gifted.ev.on("messages.upsert", async ({ messages }) => {
            const ms = messages[0];
            if (!ms?.message || !ms?.key) return;

            // JID Normalization function
            const standardizeJid = (jid) => {
                if (!jid) return '';
                return jid.split(':')[0].split('/')[0].toLowerCase() + (jid.includes('@') ? '' : '@s.whatsapp.net');
            };

            const botId = standardizeJid(Gifted.user?.id);
            const from = standardizeJid(ms.key.remoteJid);
            const isGroup = from.endsWith("@g.us");
            
            let groupMetadata = isGroup ? await Gifted.groupMetadata(from).catch(() => null) : null;
            const sender = isGroup ? (ms.key.participant || ms.participant) : from;

            const type = getContentType(ms.message);
            const body = (type === 'conversation') ? ms.message.conversation : 
                         (type === 'extendedTextMessage') ? ms.message.extendedTextMessage.text : 
                         (ms.message[type]?.caption) ? ms.message[type].caption : '';
            
            const isCommand = body.startsWith(botPrefix);
            const cmd = isCommand ? body.slice(botPrefix.length).trim().split(' ').shift().toLowerCase() : '';
            const args = body.trim().split(/\s+/).slice(1);
            const q = args.join(" ");

            // Permission Checks
            const sudoNumbers = (config.SUDO_NUMBERS ? config.SUDO_NUMBERS.split(',') : []).map(n => standardizeJid(n.trim()));
            const isOwner = sudoNumbers.includes(standardizeJid(sender)) || standardizeJid(sender).includes(ownerNumber);

            if (autoRead === "true") await Gifted.readMessages([ms.key]);
            if (antiLink !== 'false' && isGroup) await GiftedAntiLink(Gifted, ms, antiLink);

            if (isCommand) {
                const gmd = Array.isArray(evt.commands) ? evt.commands.find((c) => c.pattern === cmd || (c.aliases && c.aliases.includes(cmd))) : null;

                if (gmd) {
                    if (botMode === "private" && !isOwner) return;

                    if (autoTyping === "true") Gifted.sendPresenceUpdate('composing', from);
                    if (autoRecording === "true") Gifted.sendPresenceUpdate('recording', from);

                    if ((gmd.use || gmd.example) && !q) {
                        return Gifted.sendMessage(from, { text: `*══✪ [ ${cmd.toUpperCase()} ] ✪══*\n\n❌ *Missing Arguments*\n📝 *Usage:* ${botPrefix}${cmd} ${gmd.use || ''}` }, { quoted: ms });
                    }

                    try {
                        const conText = {
                            m: ms, Gifted, arg: args, q, sender, from, isGroup, isOwner, botName, botPrefix, config, 
                            reply: (teks) => Gifted.sendMessage(from, { text: teks }, { quoted: ms }),
                            react: (emoji) => Gifted.sendMessage(from, { react: { key: ms.key, text: emoji } }),
                            delete: (msg) => Gifted.sendMessage(from, { delete: msg.key })
                        };
                        await gmd.function(from, Gifted, conText);
                        await Gifted.sendMessage(from, { react: { key: ms.key, text: "✅" } });
                    } catch (error) {
                        console.error(`Command error [${cmd}]:`, error);
                        await Gifted.sendMessage(from, { text: `🚨 *ERROR*: ${error.message}` }, { quoted: ms });
                    }
                }
            }
        });

        // --- CONNECTION HANDLER ---
        Gifted.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === "open") {
                console.log("✅ XGURU Connected Successfully");
                if (startMess === 'true') {
                    const statusText = `*${botName} IS ONLINE*\n\nPrefix: [ ${botPrefix} ]\nMode: ${botMode}\n\n> ${botCaption}`;
                    await Gifted.sendMessage(Gifted.user.id, { text: statusText });
                }
            }
            if (connection === "close") {
                const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
                if (reason === DisconnectReason.loggedOut) {
                    fs.removeSync(sessionDir);
                    process.exit(1);
                } else {
                    setTimeout(() => startGifted(), RECONNECT_DELAY);
                }
            }
        });

    } catch (error) {
        console.error("Global Start Error:", error);
        setTimeout(() => startGifted(), RECONNECT_DELAY);
    }
}

startGifted();
