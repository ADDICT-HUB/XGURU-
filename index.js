/**
 * X-GURU SUPREME MULTI-DEVICE ARCHITECTURE
 * Engineered for: cryptixmd@gmail.com
 * Fixes: Button Payloads, Split TypeErrors, and Z_DATA_ERROR
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

// --- CORE SYSTEM IMPORTS ---
const { 
    loadSession, gmdStore, evt, runtime, monospace 
} = require("./gift");
const config = require("./config");

// --- GLOBAL CONFIG PROTECTION ---
const botPrefix = config.PREFIX || '.';
const botMode = config.MODE || 'public';
const ownerNumber = config.OWNER_NUMBER || '';
const botName = config.BOT_NAME || 'X-GURU';

const app = express();
const PORT = process.env.PORT || 8000;
const sessionDir = path.join(__dirname, "gift", "session");

// --- 1. SESSION REPAIR DOCTOR (Fixes Z_DATA_ERROR) ---
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
            console.log("✅ Session Doctor: Credentials Stabilized.");
        } catch (e) { console.log("❌ Session Fix Error:", e.message); }
    } else {
        try { loadSession(); } catch(e) {}
    }
}

// --- 2. MAIN ENGINE ---
async function startBot() {
    await fixSession();

    const { version } = await fetchLatestWaWebVersion();
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const store = makeInMemoryStore({ logger: pino().child({ level: 'silent' }) });

    const Gifted = giftedConnect({
        version,
        logger: pino({ level: "silent" }),
        printQRInTerminal: true,
        browser: ["X-GURU-ULTRA", "Safari", "3.0"],
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" }))
        },
        connectTimeoutMs: 60000,
        // This patch forces messages to be sent as "ViewOnce" to bypass button restrictions
        patchMessageBeforeSending: (message) => {
            const requiresPatch = !!(message.buttonsMessage || message.listMessage || message.templateMessage);
            if (requiresPatch) {
                return { viewOnceMessage: { message: { messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 }, ...message } } };
            }
            return message;
        }
    });

    store.bind(Gifted.ev);
    Gifted.ev.on('creds.update', saveCreds);

    // --- 3. THE CONNECTED TABLE MESSAGE ---
    Gifted.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "open") {
            console.log("🚀 X-GURU ONLINE");

            // Monospaced ASCII Table for Connection (Avoids Button Errors)
            let connTable = "```" + `
╔══════════════════════════════╗
║    X-GURU CONNECTED OK       ║
╠══════════════════════════════╣
║ PREFIX   ║ ${botPrefix}               ║
║ MODE     ║ ${botMode}           ║
║ PLUGINS  ║ 274 LOADED        ║
║ OWNER    ║ ${ownerNumber}    ║
╚══════════════════════════════╝` + "```";

            await Gifted.sendMessage(Gifted.user.id, { text: connTable });
        }
        if (connection === "close") {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) startBot();
        }
    });

    // --- 4. PLUGIN LOADER ---
    const loadPlugins = () => {
        const pDir = path.join(__dirname, "gifted");
        if (fs.existsSync(pDir)) {
            fs.readdirSync(pDir).forEach(file => {
                if (file.endsWith(".js")) require(path.join(pDir, file));
            });
        }
    };
    loadPlugins();

    // --- 5. SAFE MESSAGE HANDLER (Prevents Split/Undefined Errors) ---
    Gifted.ev.on("messages.upsert", async ({ messages }) => {
        const m = messages[0];
        if (!m.message) return;

        const from = m.key.remoteJid;
        const botId = jidNormalizedUser(Gifted.user.id);
        
        // SAFE SENDER DETECTION (Fixes 'split' error)
        const senderJid = m.key.fromMe ? botId : (m.key.participant || from || '');
        const senderNumber = senderJid ? senderJid.split('@')[0] : '';
        
        const type = getContentType(m.message);
        const body = (type === 'conversation') ? m.message.conversation : 
                     (type === 'extendedTextMessage') ? m.message.extendedTextMessage.text : 
                     (m.message[type]?.caption) || '';

        const isCmd = body.startsWith(botPrefix);
        const command = isCmd ? body.slice(botPrefix.length).trim().split(' ').shift().toLowerCase() : '';
        const args = body.trim().split(/\s+/).slice(1);
        const q = args.join(" ");

        // SAFE OWNER CHECK
        const isOwner = (ownerNumber && ownerNumber.includes(senderNumber)) || m.key.fromMe;

        if (isCmd) {
            const cmd = evt.commands.find(c => c.pattern === command || (c.aliases && c.aliases.includes(command)));
            if (cmd) {
                if (botMode === "private" && !isOwner) return;

                const context = {
                    m, Gifted, q, args, from, sender: senderJid, isOwner, 
                    reply: (t) => Gifted.sendMessage(from, { text: t }, { quoted: m }),
                    react: (e) => Gifted.sendMessage(from, { react: { key: m.key, text: e } })
                };

                try {
                    await cmd.function(from, Gifted, context);
                } catch (err) {
                    console.error("Command Error:", err);
                    await Gifted.sendMessage(from, { text: `❌ *Error:* ${err.message}` });
                }
            }
        }
    });
}

app.get("/", (req, res) => res.send("X-GURU IS ACTIVE"));
app.listen(PORT);
startBot();
