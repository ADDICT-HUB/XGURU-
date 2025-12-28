// general.js - FULL EXPANDED VERSION
// Author: NI MBAYA
// Username: GuruTech
// Botname: XGURU
// Repository: https://github.com/ADDICT-HUB/XGURU
// Enhanced by: Silva Tech Nexus

const { gmd, evt, gmdBuffer, gmdJson, getMediaBuffer } = require("../gift");
const axios = require("axios");
const fs = require("fs-extra");
const config = require("../config");

// ═══════════════════════════════════════════════════════════════
// 🔒 PROTECTED COURTESY MESSAGE - DO NOT MODIFY
// ═══════════════════════════════════════════════════════════════
const PROTECTED_COURTESY = "Courtesy of Silva Tech Nexus";
const PROTECTED_HASH = "STN-2024-XGURU-PROTECTED";

// Integrity check function
function verifyIntegrity() {
    const check1 = PROTECTED_COURTESY === "Courtesy of Silva Tech Nexus";
    const check2 = PROTECTED_HASH === "STN-2024-XGURU-PROTECTED";
    
    if (!check1 || !check2) {
        console.error("\n❌ CRITICAL ERROR: Protected content modified!");
        console.error("Plugin integrity compromised. Terminating...\n");
        process.exit(1);
    }
    return true;
}

// Run integrity check on load
verifyIntegrity();

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
gmd({
    pattern: "ghost",
    desc: "Toggle invisibility status",
    category: "owner",
    usage: "ghost on/off",
    react: "👻"
}, async (from, Gifted, conText) => {
    const { args, isSuperUser, reply, react } = conText;
    
    if (!isSuperUser) {
        return reply("❌ *NI MBAYA!* Access Denied. Owner only.");
    }
    
    const status = args[0]?.toLowerCase();
    
    try {
        if (status === 'on') {
            config.PRESENCE = 'unavailable';
            await Gifted.sendPresenceUpdate('unavailable', from);
            await react("👻");
            return reply(
                "👻 *𝐆𝐇𝐎𝐒𝐓 𝐌𝐎𝐃𝐄 𝐀𝐂𝐓𝐈𝐕𝐀𝐓𝐄𝐃*\n\n" +
                "Status: Hidden\n" +
                "Visibility: NI MBAYA 😅\n\n" +
                `> ${PROTECTED_COURTESY}`
            );
        } else if (status === 'off') {
            config.PRESENCE = 'available';
            await Gifted.sendPresenceUpdate('available', from);
            await react("👁️");
            return reply(
                "👁️ *𝐆𝐇𝐎𝐒𝐓 𝐌𝐎𝐃𝐄 𝐃𝐄𝐀𝐂𝐓𝐈𝐕𝐀𝐓𝐄𝐃*\n\n" +
                "Status: Online\n" +
                "Visibility: Public\n\n" +
                `> ${PROTECTED_COURTESY}`
            );
        } else {
            return reply(
                `*Current Presence:* ${config.PRESENCE || 'available'}\n` +
                `*Usage:* ${config.PREFIX}ghost on/off\n\n` +
                `> ${PROTECTED_COURTESY}`
            );
        }
    } catch (error) {
        console.error("Ghost command error:", error);
        return reply("❌ Failed to update presence status.");
    }
});

// 2. KICK COMMAND (GROUP MANAGEMENT)
gmd({
    pattern: "kick",
    desc: "Remove a user from group",
    category: "group",
    react: "🚫"
}, async (from, Gifted, conText) => {
    const { m, isAdmin, isBotAdmin, isSuperUser, reply, react } = conText;
    
    if (!m.isGroup) {
        return reply("❌ Group only command.");
    }
    
    if (!isAdmin && !isSuperUser) {
        return reply("❌ You are not an Admin.");
    }
    
    if (!isBotAdmin) {
        return reply("❌ Make me Admin first.");
    }

    try {
        let user = m.message.extendedTextMessage?.contextInfo?.mentionedJid[0] || 
                   m.message.extendedTextMessage?.contextInfo?.participant;
        
        if (!user) {
            return reply("⚠️ Tag the person to kick.");
        }

        await Gifted.groupParticipantsUpdate(from, [user], "remove");
        await react("✅");
        return reply(`✅ Member removed from the squad.\n\n> ${PROTECTED_COURTESY}`);
    } catch (error) {
        console.error("Kick error:", error);
        return reply("❌ Failed to kick member.");
    }
});

// 3. PROMOTE COMMAND
gmd({
    pattern: "promote",
    desc: "Promote a user to admin",
    category: "group",
    react: "⬆️"
}, async (from, Gifted, conText) => {
    const { m, isAdmin, isBotAdmin, isSuperUser, reply, react } = conText;
    
    if (!m.isGroup) return reply("❌ Group only command.");
    if (!isAdmin && !isSuperUser) return reply("❌ You are not an Admin.");
    if (!isBotAdmin) return reply("❌ Make me Admin first.");

    try {
        let user = m.message.extendedTextMessage?.contextInfo?.mentionedJid[0] || 
                   m.message.extendedTextMessage?.contextInfo?.participant;
        
        if (!user) return reply("⚠️ Tag the person to promote.");

        await Gifted.groupParticipantsUpdate(from, [user], "promote");
        await react("✅");
        return reply(`✅ Member promoted to Admin.\n\n> ${PROTECTED_COURTESY}`);
    } catch (error) {
        console.error("Promote error:", error);
        return reply("❌ Failed to promote member.");
    }
});

// 4. DEMOTE COMMAND
gmd({
    pattern: "demote",
    desc: "Demote an admin to member",
    category: "group",
    react: "⬇️"
}, async (from, Gifted, conText) => {
    const { m, isAdmin, isBotAdmin, isSuperUser, reply, react } = conText;
    
    if (!m.isGroup) return reply("❌ Group only command.");
    if (!isAdmin && !isSuperUser) return reply("❌ You are not an Admin.");
    if (!isBotAdmin) return reply("❌ Make me Admin first.");

    try {
        let user = m.message.extendedTextMessage?.contextInfo?.mentionedJid[0] || 
                   m.message.extendedTextMessage?.contextInfo?.participant;
        
        if (!user) return reply("⚠️ Tag the person to demote.");

        await Gifted.groupParticipantsUpdate(from, [user], "demote");
        await react("✅");
        return reply(`✅ Admin demoted to Member.\n\n> ${PROTECTED_COURTESY}`);
    } catch (error) {
        console.error("Demote error:", error);
        return reply("❌ Failed to demote member.");
    }
});

// 5. MENU COMMAND (NI MBAYA TABLE STRUCTURE)
gmd({
    pattern: "menu",
    aliases: ["help", "commands"],
    desc: "Show full command list",
    category: "user",
    react: "📜"
}, async (from, Gifted, conText) => {
    const { botName, botPrefix, ownerName, reply, react } = conText;
    
    // Verify integrity before showing menu
    verifyIntegrity();
    
    try {
        const totalCommands = evt.commands ? evt.commands.length : 0;
        const menu = `
✨ *𝐗-𝐆𝐔𝐑𝐔 𝐌𝐃 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒* ✨

╔════════════════════════╗
  *『 𝐒𝐘𝐒𝐓𝐄𝐌 𝐈𝐍𝐅𝐎𝐑𝐌𝐀𝐓𝐈𝐎𝐍 』*
  
  ⋄ 𝐒𝐭𝐚𝐭𝐮𝐬   : 𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅
  ⋄ 𝐁𝐨𝐭      : ${botName || 'XGURU'}
  ⋄ 𝐀𝐮𝐭𝐡𝐨𝐫   : 𝐍𝐈 𝐌𝐁𝐀𝐘𝐀
  ⋄ 𝐔𝐬𝐞𝐫     : ${ownerName || 'User'}
  ⋄ 𝐏𝐫𝐞𝐟𝐢𝐱   : [ ${botPrefix || '.'} ]
  ⋄ 𝐂𝐦𝐝𝐬     : ${totalCommands}
╚════════════════════════╝

🛠️ *𝐎𝐖𝐍𝐄𝐑 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒*
⋄ ${botPrefix}ghost (on/off)
⋄ ${botPrefix}mode (public/private)
⋄ ${botPrefix}autorecord (on/off)
⋄ ${botPrefix}autoviewstatus (on/off)

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
${config.NEWSLETTER_URL || 'https://whatsapp.com/channel/0029VarnmSo8rsM02iy8qB3Q'}

> *${PROTECTED_COURTESY}*`;

        await Gifted.sendMessage(from, {
            text: menu,
            contextInfo: {
                externalAdReply: {
                    title: "𝐗-𝐆𝐔𝐑𝐔 𝐌𝐃 𝐕𝟓",
                    body: "𝐆𝐮𝐫𝐮𝐓𝐞𝐜𝐡 𝐎𝐟𝐟𝐢𝐜𝐢𝐚𝐥",
                    thumbnailUrl: "https://files.catbox.moe/atpgij.jpg",
                    sourceUrl: config.NEWSLETTER_URL || 'https://whatsapp.com/channel/0029VarnmSo8rsM02iy8qB3Q',
                    mediaType: 1
                }
            }
        });
        
        await react("✅");
    } catch (error) {
        console.error("Menu error:", error);
        return reply("❌ Failed to load menu.");
    }
});

// 6. PING COMMAND
gmd({
    pattern: "ping",
    aliases: ["speed"],
    desc: "Check response speed",
    category: "user",
    react: "⚡"
}, async (from, Gifted, conText) => {
    const { reply, react } = conText;
    
    try {
        const start = new Date().getTime();
        const { key } = await Gifted.sendMessage(from, { text: "🚀 *Pinging...*" });
        const end = new Date().getTime();
        
        await Gifted.sendMessage(from, { 
            text: `⚡ *𝐏𝐎𝐍𝐆:* ${end - start}𝐦𝐬\n\n> ${PROTECTED_COURTESY}`, 
            edit: key 
        });
        
        await react("✅");
    } catch (error) {
        console.error("Ping error:", error);
        return reply("❌ Failed to measure ping.");
    }
});

// 7. RUNTIME COMMAND
gmd({
    pattern: "runtime",
    aliases: ["uptime"],
    desc: "Bot active time",
    category: "user",
    react: "⏰"
}, async (from, Gifted, conText) => {
    const { reply, react } = conText;
    
    try {
        const uptime = runtime(process.uptime());
        await react("✅");
        return reply(`⏰ *𝐗-𝐆𝐔𝐑𝐔 𝐔𝐏𝐓𝐈𝐌𝐄:* ${uptime}\n\n> ${PROTECTED_COURTESY}`);
    } catch (error) {
        console.error("Runtime error:", error);
        return reply("❌ Failed to get uptime.");
    }
});

// 8. REPO COMMAND
gmd({
    pattern: "repo",
    aliases: ["sc", "script"],
    desc: "Source code link",
    category: "user",
    react: "📦"
}, async (from, Gifted, conText) => {
    const { reply, react } = conText;
    
    try {
        const repo = `📦 *𝐗-𝐆𝐔𝐑𝐔 𝐑𝐄𝐏𝐎𝐒𝐈𝐓𝐎𝐑𝐘*\n\n🔗 *Link:* https://github.com/ADDICT-HUB/XGURU\n\n*Author:* NI MBAYA\n*Status:* NI MBAYA 😅\n\n> ${PROTECTED_COURTESY}`;
        
        await react("✅");
        return reply(repo);
    } catch (error) {
        console.error("Repo error:", error);
        return reply("❌ Failed to fetch repository info.");
    }
});

// 9. OWNER COMMAND
gmd({
    pattern: "owner",
    aliases: ["creator", "dev"],
    desc: "Get bot owner contact",
    category: "user",
    react: "👤"
}, async (from, Gifted, conText) => {
    const { reply, react } = conText;
    
    try {
        const ownerInfo = `👤 *𝐁𝐎𝐓 𝐎𝐖𝐍𝐄𝐑 𝐈𝐍𝐅𝐎*\n\n` +
                         `*Name:* NI MBAYA\n` +
                         `*Developer:* GuruTech\n` +
                         `*Number:* ${config.OWNER_NUMBER || '+254799916673'}\n` +
                         `*Status:* NI MBAYA 😅\n\n` +
                         `> ${PROTECTED_COURTESY}`;
        
        await react("✅");
        return reply(ownerInfo);
    } catch (error) {
        console.error("Owner error:", error);
        return reply("❌ Failed to get owner info.");
    }
});

// 10. TAGALL COMMAND
gmd({
    pattern: "tagall",
    aliases: ["tag"],
    desc: "Tag all group members",
    category: "group",
    react: "📢"
}, async (from, Gifted, conText) => {
    const { m, isAdmin, isSuperUser, reply, react } = conText;
    
    if (!m.isGroup) return reply("❌ Group only command.");
    if (!isAdmin && !isSuperUser) return reply("❌ Admin only command.");
    
    try {
        const groupMetadata = await Gifted.groupMetadata(from);
        const participants = groupMetadata.participants;
        
        let mentions = participants.map(p => p.id);
        let text = `📢 *𝐆𝐑𝐎𝐔𝐏 𝐓𝐀𝐆*\n\n`;
        
        participants.forEach((participant, index) => {
            text += `${index + 1}. @${participant.id.split('@')[0]}\n`;
        });
        
        text += `\n> ${PROTECTED_COURTESY}`;
        
        await Gifted.sendMessage(from, {
            text: text,
            mentions: mentions
        });
        
        await react("✅");
    } catch (error) {
        console.error("TagAll error:", error);
        return reply("❌ Failed to tag members.");
    }
});

// Final integrity check
verifyIntegrity();

module.exports = { formatBytes, runtime, PROTECTED_COURTESY };
console.log("✅ General plugin fully loaded - XGURU by NI MBAYA");
console.log(`🔒 Protected by: ${PROTECTED_COURTESY}`);
