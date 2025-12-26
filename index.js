/**
 * X-GURU ULTIMATE SUPREME - RENDER EDITION
 * Fixed: Message Listener & Owner Detection
 **/

const { 
    default: giftedConnect, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestWaWebVersion, 
    makeCacheableSignalKeyStore, 
    getContentType, 
    jidNormalizedUser,
    makeInMemoryStore 
} = require("gifted-baileys");

const fs = require("fs-extra");
const path = require("path");
const pino = require("pino");
const zlib = require("zlib");
const { Boom } = require("@hapi/boom");
const express = require("express");

const { loadSession, gmdStore, evt, runtime, monospace } = require("./gift");
const config = require("./config");

const sessionDir = path.join(__dirname, "gift", "session");

async function repairSession() {
    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });
    const sid = process.env.SESSION_ID || config.SESSION_ID;
    if (sid && sid.includes("Xguru~")) {
        try {
            const b64Data = sid.split("~")[1].replace(/\./g, "").trim();
            const buffer = Buffer.from(b64Data, "base64");
            try {
                const decompressed = zlib.gunzipSync(buffer);
                fs.writeFileSync(path.join(sessionDir, "creds.json"), decompressed);
            } catch {
                fs.writeFileSync(path.join(sessionDir, "creds.json"), buffer.toString("utf-8"));
            }
            console.log("✅ Engine: Raw Credentials Stabilized.");
        } catch (e) { console.log("❌ Session Repair Failed."); }
    }
}

async function startBot() {
    await repairSession();
    const { version } = await fetchLatestWaWebVersion();
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    const Gifted = giftedConnect({
        version,
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" }))
        },
        patchMessageBeforeSending: (message) => {
            const requiresPatch = !!(message.buttonsMessage || message.listMessage || message.templateMessage);
            if (requiresPatch) {
                return { viewOnceMessage: { message: { messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 }, ...message } } };
            }
            return message;
        }
    });

    Gifted.ev.on('creds.update', saveCreds);

    Gifted.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "open") {
            console.log("✅ SUCCESS: X-GURU IS ONLINE");
            await Gifted.sendMessage(Gifted.user.id, { text: "🚀 *X-GURU IS ACTIVE ON RENDER*\nPrefix: " + config.PREFIX });
        }
        if (connection === "close") {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) startBot();
        }
    });

    // Load Plugins
    const pDir = path.join(__dirname, "gifted");
    if (fs.existsSync(pDir)) {
        fs.readdirSync(pDir).forEach(file => {
            if (file.endsWith(".js")) require(path.join(pDir, file));
        });
    }

    Gifted.ev.on("messages.upsert", async ({ messages }) => {
        const m = messages[0];
        if (!m.message) return;

        const from = m.key.remoteJid;
        const type = getContentType(m.message);
        const body = (type === 'conversation') ? m.message.conversation : 
                     (type === 'extendedTextMessage') ? m.message.extendedTextMessage.text : 
                     (m.message[type]?.caption) || '';

        const prefix = config.PREFIX || '.';
        const isCmd = body.startsWith(prefix);
        const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : '';
        
        // --- SENDER DEBUGGING ---
        const senderJid = m.key.participant || m.key.remoteJid;
        const senderNumber = senderJid.split('@')[0].replace(/[^0-9]/g, '');
        const cleanOwner = config.OWNER_NUMBER.replace(/[^0-9]/g, '');
        
        const isOwner = cleanOwner.includes(senderNumber) || m.key.fromMe;

        if (isCmd) {
            console.log(`📩 Command: ${command} | From: ${senderNumber} | IsOwner: ${isOwner}`);
            
            // Hardcoded Test Command
            if (command === 'test') return reply(Gifted, from, "✅ Bot is responding perfectly!", m);

            const cmd = evt.commands.find(c => c.pattern === command || (c.aliases && c.aliases.includes(command)));
            if (cmd) {
                if (config.MODE === "private" && !isOwner) return;
                try {
                    await cmd.function(from, Gifted, { 
                        m, Gifted, q: body.split(" ").slice(1).join(" "), 
                        from, isOwner, reply: (t) => reply(Gifted, from, t, m) 
                    });
                } catch (e) { console.log(e); }
            }
        }
    });
}

function reply(Gifted, from, text, m) {
    return Gifted.sendMessage(from, { text }, { quoted: m });
}

const app = express();
app.get("/", (req, res) => res.send("X-GURU LIVE"));
app.listen(process.env.PORT || 8000);
startBot();
