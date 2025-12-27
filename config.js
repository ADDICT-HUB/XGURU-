const fs = require('fs-extra');
if (fs.existsSync('.env')) require('dotenv').config({ path: __dirname + '/.env' });
const path = require("path");

module.exports = { 
    // ===== BOT CORE SETTINGS =====
    SESSION_ID: process.env.SESSION_ID,
    PREFIX: process.env.PREFIX || ".",
    BOT_NAME: process.env.BOT_NAME || "X GURU",
    BOT_PIC: process.env.BOT_PIC || "https://files.catbox.moe/7czrlj.jpg",
    MODE: process.env.MODE || "public",
    VERSION: process.env.VERSION || "5.0.0",
    FOOTER: process.env.FOOTER || "Powered by X GURU",
    CAPTION: process.env.CAPTION || "© 2025 X GURU",

    // ===== OWNER & SUDO =====
    OWNER_NAME: process.env.OWNER_NAME || "GuruTech",
    OWNER_NUMBER: process.env.OWNER_NUMBER || "254704355518",
    SUDO_NUMBERS: process.env.SUDO_NUMBERS || "254755257907",

    // ===== MESSAGING & PRESENCE AUTOMATION =====
    PM_PERMIT: process.env.PM_PERMIT || "false",
    TIME_ZONE: process.env.TIME_ZONE || "Africa/Nairobi",
    AUTO_TYPING: process.env.AUTO_TYPING || "true", 
    AUTO_RECORDING: process.env.AUTO_RECORDING || "false",
    GHOST_MODE: process.env.GHOST_MODE || "false", // For Blue Tick Hider

    // ===== ANTI-FEATURES & SHIELDS =====
    ANTIDELETE: process.env.ANTIDELETE || "indm",
    ANTICALL: process.env.ANTICALL || "false",
    ANTISPAM: process.env.ANTISPAM || "false", // For Auto-Block Spammers
    ANTILINK: process.env.ANTILINK || "false",
    
    // ===== ADVANCED SKILL TOGGLES (The ones I missed!) =====
    SKILL_PDF: process.env.SKILL_PDF || "true",       // Text-to-PDF Skill
    SKILL_SS: process.env.SKILL_SS || "true",         // Web Screenshot Skill
    SKILL_TRT: process.env.SKILL_TRT || "true",       // Translator Skill
    SKILL_FIX: process.env.SKILL_FIX || "true",       // AI Code Helper
    SKILL_VANISH: process.env.SKILL_VANISH || "true", // Self-Destruct Messages

    // ===== STATUS & SIGNATURE AUTOMATIONS =====
    AUTO_LIKE_STATUS: process.env.AUTO_LIKE_STATUS || "true",
    AUTO_READ_STATUS: process.env.AUTO_READ_STATUS || "true",
    AUTO_REACT: process.env.AUTO_REACT || "false",    // For the 😅 Signature
    AUTO_BIO: process.env.AUTO_BIO || "false",
    AUTO_READ_MESSAGES: process.env.AUTO_READ_MESSAGES || "false",

    // ===== LINKS & CHANNELS =====
    YT: process.env.YT || "youtube.com/@XGURU",
    NEWSLETTER_JID: process.env.NEWSLETTER_JID || "120363421164015033@newsletter",
    BOT_REPO: process.env.BOT_REPO || "https://github.com/ADDICT-HUB/XGURU-",

    // ===== STICKER & MEDIA PACK =====
    PACK_NAME: process.env.PACK_NAME || "X GURU",
    PACK_AUTHOR: process.env.PACK_AUTHOR || "GuruTech"
};

// Auto-reload config on changes
let fileName = require.resolve(__filename);
fs.watchFile(fileName, () => {
    fs.unwatchFile(fileName);
    console.log(`✅ Reloaded config: ${__filename}`);
    delete require.cache[fileName];
    require(fileName);
});
