const { evt } = require("../gift");

evt.commands.push({
    pattern: "broadcast",
    alias: ["bc", "bcall", "bcgc"],
    desc: "Send a message to all chats or groups",
    react: "📢",
    category: "owner",
    function: async (from, Gifted, conText) => {
        const { args, isSuperUser, reply, botName, botCaption, newsletterUrl, botPrefix } = conText;

        // 1. Owner Security Check
        if (!isSuperUser) return reply("❌ This command is restricted to the Owner.");

        // 2. Check for message content
        const broadcastMsg = args.join(" ");
        if (!broadcastMsg) return reply(`*Usage:*\n${botPrefix}broadcast [your message]\n\n*Example:* ${botPrefix}broadcast Hello everyone, NI MBAYA! 😅`);

        // 3. Get all chats
        const allChats = await Gifted.groupFetchAllParticipating();
        const groups = Object.values(allChats);
        const contactChats = await Gifted.store.chats.all(); // Requires store to be active in index.js

        const targetGroups = groups.map(v => v.id);
        const targetAll = [...targetGroups, ...contactChats.map(v => v.id)];

        // Choose target based on alias used
        const isGroupOnly = conText.cmdName === "bcgc";
        const targets = isGroupOnly ? targetGroups : targetAll;

        await reply(`📢 *𝐒𝐞𝐧𝐝𝐢𝐧𝐠 𝐁𝐫𝐨𝐚𝐝𝐜𝐚𝐬𝐭...*\n𝐓𝐚𝐫𝐠𝐞𝐭𝐬: ${targets.length} 𝐜𝐡𝐚𝐭𝐬.\n𝐏𝐥𝐞𝐚𝐬𝐞 𝐰𝐚𝐢𝐭...`);

        // 4. Send Loop
        for (let jid of targets) {
            try {
                // Professional Broadcast Header
                const finalBc = `
✨ *𝐗-𝐆𝐔𝐑𝐔 𝐌𝐃 𝐁𝐑𝐎𝐀𝐃𝐂𝐀𝐒𝐓* ✨

╔════════════════════════╗
${broadcastMsg}
╚════════════════════════╝

> *${botCaption}*
> *Developed by GuruTech*
> *NI MBAYA 😅*`;

                await Gifted.sendMessage(jid, { 
                    text: finalBc,
                    contextInfo: {
                        externalAdReply: {
                            title: `📢 OFFICIAL ANNOUNCEMENT`,
                            body: "𝐒𝐭𝐚𝐭𝐮𝐬: 𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅",
                            thumbnailUrl: "https://files.catbox.moe/atpgij.jpg",
                            sourceUrl: newsletterUrl,
                            mediaType: 1,
                            renderLargerThumbnail: false
                        }
                    }
                });
                // Small delay to prevent WhatsApp spam ban
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (e) {
                console.error(`Failed to send BC to ${jid}:`, e);
            }
        }

        return reply("✅ *𝐁𝐫𝐨𝐚𝐝𝐜𝐚𝐬𝐭 𝐂𝐨𝐦𝐩𝐥𝐞𝐭𝐞𝐝 𝐒𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥𝐥𝐲!*");
    }
});
