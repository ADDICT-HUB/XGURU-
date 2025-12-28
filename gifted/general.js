// general.js - Fixed version
// Author: NI MBAYA
// Username: GuruTech
// Botname: XGURU
// Repository: https://github.com/ADDICT-HUB/XGURU
// Newsletter: 120363421164015033@newsletter

const { evt, gmdBuffer, gmdJson, getMediaBuffer } = require("../gift");
const axios = require("axios");
const fs = require("fs-extra");
const FormData = require("form-data");
const config = require("../config");

// Add missing formatBytes function
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Add other missing utility functions
function getRandom(ext) {
    return `${Math.floor(Math.random() * 10000)}${ext}`;
}

function runtime(seconds) {
    seconds = Number(seconds);
    var d = Math.floor(seconds / (3600 * 24));
    var h = Math.floor(seconds % (3600 * 24) / 3600);
    var m = Math.floor(seconds % 3600 / 60);
    var s = Math.floor(seconds % 60);
    var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
    var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
    var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
    return dDisplay + hDisplay + mDisplay + sDisplay;
}

// Command patterns
evt({
    pattern: "ping",
    fromMe: true,
    desc: "Check bot response time",
    type: "user"
}, async (message, match) => {
    const start = new Date().getTime();
    await message.reply("🏓 Pinging...");
    const end = new Date().getTime();
    const responseTime = end - start;
    
    await message.reply(`✅ *XGURU Bot Status*\n\n` +
                       `🏓 *Ping:* ${responseTime}ms\n` +
                       `🤖 *Bot:* XGURU by NI MBAYA\n` +
                       `👤 *User:* GuruTech\n` +
                       `📦 *Repo:* https://github.com/ADDICT-HUB/XGURU\n` +
                       `📬 *Updates:* 120363421164015033@newsletter`);
});

evt({
    pattern: "runtime",
    fromMe: true,
    desc: "Check bot uptime",
    type: "user"
}, async (message) => {
    const uptime = process.uptime();
    await message.reply(`⏰ *Bot Uptime:* ${runtime(uptime)}\n` +
                       `🤖 *XGURU Bot* - Powered by NI MBAYA`);
});

evt({
    pattern: "owner",
    fromMe: false,
    desc: "Get bot owner info",
    type: "user"
}, async (message) => {
    await message.reply(`👑 *XGURU Bot Owner*\n\n` +
                       `📛 *Name:* NI MBAYA\n` +
                       `👤 *Username:* GuruTech\n` +
                       `📱 *Contact:* ${config.OWNER_NUMBER || "Not set"}\n` +
                       `🤖 *Bot:* XGURU\n` +
                       `📦 *Repository:* https://github.com/ADDICT-HUB/XGURU\n` +
                       `📬 *Newsletter:* 120363421164015033@newsletter`);
});

evt({
    pattern: "menu",
    fromMe: false,
    desc: "Show bot menu",
    type: "user"
}, async (message) => {
    const totalCommands = evt.commands ? evt.commands.filter(cmd => cmd.pattern).length : 0;
    
    await message.reply(`📱 *XGURU BOT MENU*\n\n` +
                       `🤖 *Bot:* XGURU\n` +
                       `👤 *Author:* NI MBAYA\n` +
                       `👥 *Username:* GuruTech\n` +
                       `📦 *Repo:* https://github.com/ADDICT-HUB/XGURU\n` +
                       `📬 *Updates:* 120363421164015033@newsletter\n` +
                       `🔧 *Commands:* ${totalCommands}\n` +
                       `⚙️ *Prefix:* ${config.PREFIX}\n\n` +
                       `📚 *Categories:*\n` +
                       `• 🤖 General\n` +
                       `• 🎨 Media\n` +
                       `• 🛠️ Tools\n` +
                       `• 👥 Group\n` +
                       `• ⚙️ Owner\n\n` +
                       `💡 Use *${config.PREFIX}help* for more info`);
});

evt({
    pattern: "help",
    fromMe: false,
    desc: "Show command help",
    type: "user"
}, async (message, match) => {
    if (!match) {
        await message.reply(`ℹ️ *XGURU Bot Help*\n\n` +
                           `Use *${config.PREFIX}help <command>* for specific help\n` +
                           `Example: *${config.PREFIX}help ping*\n\n` +
                           `📦 *Repository:* https://github.com/ADDICT-HUB/XGURU\n` +
                           `📬 *Newsletter:* 120363421164015033@newsletter`);
        return;
    }
    
    const cmd = match.trim().toLowerCase();
    const command = evt.commands?.find(c => 
        c.pattern === cmd || (c.aliases && c.aliases.includes(cmd))
    );
    
    if (command) {
        await message.reply(`📖 *${cmd} Command*\n\n` +
                           `📝 *Description:* ${command.desc || "No description"}\n` +
                           `🔧 *Type:* ${command.type || "user"}\n` +
                           `⚙️ *Usage:* ${config.PREFIX}${command.pattern}\n` +
                           `🤖 *XGURU Bot* - by NI MBAYA`);
    } else {
        await message.reply(`❌ Command *${cmd}* not found\n` +
                           `💡 Use *${config.PREFIX}menu* to see all commands`);
    }
});

evt({
    pattern: "repo",
    fromMe: false,
    desc: "Get bot repository link",
    type: "user"
}, async (message) => {
    await message.reply(`📦 *XGURU Repository*\n\n` +
                       `🔗 *GitHub:* https://github.com/ADDICT-HUB/XGURU\n` +
                       `👤 *Author:* NI MBAYA\n` +
                       `👥 *Username:* GuruTech\n` +
                       `🤖 *Bot:* XGURU\n` +
                       `📬 *Newsletter:* 120363421164015033@newsletter\n\n` +
                       `⭐ Star the repo if you like it!`);
});

evt({
    pattern: "info",
    fromMe: false,
    desc: "Get bot information",
    type: "user"
}, async (message) => {
    const totalCommands = evt.commands ? evt.commands.filter(cmd => cmd.pattern).length : 0;
    const uptime = process.uptime();
    
    await message.reply(`🤖 *XGURU BOT INFORMATION*\n\n` +
                       `📛 *Name:* XGURU\n` +
                       `👤 *Author:* NI MBAYA\n` +
                       `👥 *Username:* GuruTech\n` +
                       `📱 *Owner:* ${config.OWNER_NUMBER || "Not set"}\n` +
                       `⚙️ *Prefix:* ${config.PREFIX}\n` +
                       `🔧 *Commands:* ${totalCommands}\n` +
                       `⏰ *Uptime:* ${runtime(uptime)}\n` +
                       `📦 *Repository:* https://github.com/ADDICT-HUB/XGURU\n` +
                       `📬 *Newsletter:* 120363421164015033@newsletter\n` +
                       `🔄 *Version:* 2.0.0`);
});

// Export the utility functions
module.exports = {
    formatBytes,
    getRandom,
    runtime
};

console.log("✅ General plugin loaded - XGURU by NI MBAYA");
