// general.js - FULL EXPANDED VERSION
// Author: NI MBAYA
// Username: GuruTech
// Botname: XGURU
// Repository: https://github.com/ADDICT-HUB/XGURU

const { evt, gmdBuffer, gmdJson, getMediaBuffer } = require("../gift");
const axios = require("axios");
const fs = require("fs-extra");
const config = require("../config");

// --- UTILITY FUNCTIONS (EXPANDED) ---
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function runtime(seconds) {
    seconds = Number(seconds);
    var d = Math.floor(seconds / (3600 * 24));
    var h = Math.floor(seconds % (3600 * 24) / 3600);
    var m = Math.floor(seconds % 3600 / 60);
    var s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
}

// --- COMMANDS ---

// 1. GHOST COMMAND (GURU TECH EXCLUSIVE)
evt({
    pattern: "ghost",
    desc: "Toggle invisibility status",
    category: "owner",
    use: "ghost on/off"
}, async (from, Gifted, { args, isSuperUser, reply }) => {
    if (!isSuperUser) return reply("❌ *NI MBAYA!* Access Denied. Owner only.");
    
    const status = args[0]?.toLowerCase();
    if (status === 'on') {
        config.PRESENCE = 'unavailable';
        await Gifted.sendPresenceUpdate('unavailable', from);
        return reply("👻 *𝐆𝐇𝐎𝐒𝐓 𝐌𝐎𝐃𝐄 𝐀𝐂𝐓𝐈𝐕𝐀𝐓𝐄𝐃*\n\nStatus: Hidden\nVisibility: NI MBAYA 😅");
    } else if (status === 'off') {
        config.PRESENCE = 'available';
        await Gifted.sendPresenceUpdate('available', from);
        return reply("👁️ *𝐆𝐇𝐎𝐒𝐓 𝐌𝐎𝐃𝐄 𝐃𝐄𝐀𝐂𝐓𝐈𝐕𝐀𝐓𝐄𝐃*\n\nStatus: Online\nVisibility: Public");
    } else {
        return reply(`*Current Presence:* ${config.PRESENCE}\n*Usage:* ${config.PREFIX}ghost on/off`);
    }
});

// 2. KICK COMMAND (GROUP MANAGEMENT)
evt({
    pattern: "kick",
    desc: "Remove a user from group",
    category: "group"
}, async (from, Gifted, { m, isAdmin, isBotAdmin, isSuperUser, reply }) => {
    if (!m.isGroup) return reply("❌ Group only command.");
    if (!isAdmin && !isSuperUser) return reply("❌ You are not an Admin.");
    if (!isBotAdmin) return reply("❌ Make me Admin first.");

    let user = m.message.extendedTextMessage?.contextInfo?.mentionedJid[0] || m.message.extendedTextMessage?.contextInfo?.participant;
    if (!user) return reply("⚠️ Tag the person to kick.");

    await Gifted.groupParticipantsUpdate(from, [user], "remove");
    return reply("✅ Member removed from the squad.");
});

// 3. MENU COMMAND (NI MBAYA TABLE STRUCTURE)
evt({
    pattern: "menu",
    desc: "Show full command list",
    category: "user"
}, async (from, Gifted, { botName, botPrefix, ownerName, reply }) => {
    const totalCommands = evt.commands.length;
    const menu = `
✨ *𝐗-𝐆𝐔𝐑𝐔 𝐌𝐃 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒* ✨

╔════════════════════════╗
  *『 𝐒𝐘𝐒𝐓𝐄𝐌 𝐈𝐍𝐅𝐎𝐑𝐌𝐀𝐓𝐈𝐎𝐍 』*
  
  ⋄ 𝐒𝐭𝐚𝐭𝐮𝐬   : 𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅
  ⋄ 𝐁𝐨𝐭      : ${botName}
  ⋄ 𝐀𝐮𝐭𝐡𝐨𝐫   : 𝐍𝐈 𝐌𝐁𝐀𝐘𝐀
  ⋄ 𝐔𝐬𝐞𝐫     : ${ownerName}
  ⋄ 𝐏𝐫𝐞𝐟𝐢𝐱   : [ ${botPrefix} ]
  ⋄ 𝐂𝐦𝐝𝐬     : ${totalCommands}
╚════════════════════════╝

🛠️ *𝐎𝐖𝐍𝐄𝐑 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒*
⋄ ${botPrefix}ghost (on/off)
⋄ ${botPrefix}mode (public/private)
⋄ ${botPrefix}setprefix (symbol)

👥 *𝐆𝐑𝐎𝐔𝐏 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒*
⋄ ${botPrefix}kick (tag)
⋄ ${botPrefix}promote (tag)
⋄ ${botPrefix}demote (tag)
⋄ ${botPrefix}tagall

🤖 *𝐆𝐄𝐍𝐄𝐑𝐀𝐋 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒*
⋄ ${botPrefix}ping
⋄ ${botPrefix}runtime
⋄ ${botPrefix}repo
⋄ ${botPrefix}owner

📢 *𝐉𝐎𝐈𝐍 𝐔𝐏𝐃𝐀𝐓𝐄𝐒*
${config.NEWSLETTER_URL}

> *${config.CAPTION}*`;

    await Gifted.sendMessage(from, {
        text: menu,
        contextInfo: {
            externalAdReply: {
                title: "𝐗-𝐆𝐔𝐑𝐔 𝐌𝐃 𝐕𝟓",
                body: "𝐆𝐮𝐫𝐮𝐓𝐞𝐜𝐡 𝐎𝐟𝐟𝐢𝐜𝐢𝐚𝐥",
                thumbnailUrl: "https://files.catbox.moe/atpgij.jpg",
                sourceUrl: config.NEWSLETTER_URL,
                mediaType: 1
            }
        }
    });
});

// 4. PING COMMAND
evt({
    pattern: "ping",
    desc: "Check response speed",
    category: "user"
}, async (from, Gifted, { reply }) => {
    const start = new Date().getTime();
    const { key } = await Gifted.sendMessage(from, { text: "🚀" });
    const end = new Date().getTime();
    await Gifted.sendMessage(from, { text: `⚡ *𝐏𝐎𝐍𝐆:* ${end - start}𝐦𝐬`, edit: key });
});

// 5. RUNTIME COMMAND
evt({
    pattern: "runtime",
    desc: "Bot active time",
    category: "user"
}, async (from, Gifted, { reply }) => {
    return reply(`⏰ *𝐗-𝐆𝐔𝐑𝐔 𝐔𝐏𝐓𝐈𝐌𝐄:* ${runtime(process.uptime())}`);
});

// 6. REPO COMMAND
evt({
    pattern: "repo",
    desc: "Source code link",
    category: "user"
}, async (from, Gifted, { reply }) => {
    const repo = `📦 *𝐗-𝐆𝐔𝐑𝐔 𝐑𝐄𝐏𝐎𝐒𝐈𝐓𝐎𝐑𝐘*\n\n🔗 *Link:* https://github.com/ADDICT-HUB/XGURU\n\n*Author:* NI MBAYA\n*Status:* NI MBAYA 😅`;
    return reply(repo);
});

module.exports = { formatBytes, runtime };
console.log("✅ General plugin fully loaded - XGURU by NI MBAYA");
