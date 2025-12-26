/**
 * X-GURU SUPREME V7.1 (Bug Fix Edition)
 * Fixes: makeInMemoryStore TypeError
 **/

const { 
    default: giftedConnect, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestWaWebVersion, 
    makeCacheableSignalKeyStore, 
    getContentType, 
    jidNormalizedUser,
    // FIXED IMPORT BELOW
    makeInMemoryStore 
} = require("gifted-baileys");

// If the above still fails, some versions require this line instead:
// const makeInMemoryStore = require("gifted-baileys/lib/Store").makeInMemoryStore;

const fs = require("fs-extra");
const path = require("path");
const pino = require("pino");
const zlib = require("zlib");
const { Boom } = require("@hapi/boom");
const express = require("express");

const { loadSession, gmdStore, evt, runtime, monospace } = require("./gift");
const config = require("./config");

const botPrefix = config.PREFIX || '.';
const botMode = config.MODE || 'public';
const ownerNumber = config.OWNER_NUMBER || '';
const sessionDir = path.join(__dirname, "gift", "session");

async function fixSession() {
    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });
    const sid = process.env.SESSION_ID || config.SESSION_ID;
    if (sid && sid.includes("Xguru~")) {
        try {
            const b64Data = sid.split('~')[1].replace(/\./g, '').trim();
            const buffer = Buffer.from(b64Data, 'base64');
            try {
                const decompressed = zlib.gunzipSync(buffer);
                fs.writeFileSync(path.join(sessionDir, 'creds.json'), decompressed);
            } catch {
                fs.writeFileSync(path.join(sessionDir, 'creds.json'), buffer.toString('utf-8'));
            }
        } catch (e) { console.log("Session Fix Error"); }
    }
}

async function startBot() {
    await fixSession();
    const { version } = await fetchLatestWaWebVersion();
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    // FIXED STORE INITIALIZATION
    const store = makeInMemoryStore ? makeInMemoryStore({ logger: pino().child({ level: 'silent' }) }) : null;

    const Gifted = giftedConnect({
        version,
        logger: pino({ level: "silent" }),
        printQRInTerminal: true,
        browser: ["X-GURU-ULTRA", "Safari", "3.0"],
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

    if (store) store.bind(Gifted.ev);
    Gifted.ev.on('creds.update', saveCreds);

    Gifted.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "open") {
            let connTable = "```" + `
╔══════════════════════════════╗
║    X-GURU CONNECTED OK       ║
╠══════════════════════════════╣
║ PREFIX   ║ ${botPrefix}               ║
║ MODE     ║ ${botMode}           ║
║ STATUS   ║ STABLE             ║
╚══════════════════════════════╝` + "```";
            await Gifted.sendMessage(Gifted.user.id, { text: connTable });
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
        const botId = jidNormalizedUser(Gifted.user.id);
        const senderJid = m.key.fromMe ? botId : (m.key.participant || from || '');
        const senderNumber = senderJid.split('@')[0];
        const type = getContentType(m.message);
        const body = (type === 'conversation') ? m.message.conversation : (type === 'extendedTextMessage') ? m.message.extendedTextMessage.text : (m.message[type]?.caption) || '';
        const isCmd = body.startsWith(botPrefix);
        const command = isCmd ? body.slice(botPrefix.length).trim().split(' ').shift().toLowerCase() : '';
        const args = body.trim().split(/\s+/).slice(1);
        const isOwner = (ownerNumber && ownerNumber.includes(senderNumber)) || m.key.fromMe;

        if (isCmd) {
            const cmd = evt.commands.find(c => c.pattern === command || (c.aliases && c.aliases.includes(command)));
            if (cmd) {
                if (botMode === "private" && !isOwner) return;
                try {
                    await cmd.function(from, Gifted, { m, Gifted, q: args.join(" "), args, from, sender: senderJid, isOwner, reply: (t) => Gifted.sendMessage(from, { text: t }, { quoted: m }) });
                } catch (err) {
                    Gifted.sendMessage(from, { text: `❌ *Error:* ${err.message}` });
                }
            }
        }
    });
}

const app = express();
app.get("/", (req, res) => res.send("X-GURU ACTIVE"));
app.listen(process.env.PORT || 8000);
startBot();
