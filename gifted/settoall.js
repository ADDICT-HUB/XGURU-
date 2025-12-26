const { evt } = require("../gift");

evt.commands.push({
    pattern: "senttoall",
    alias: ["dmall", "pmall"],
    category: "group",
    desc: "Sends a message to every group member's DM",
    function: async (from, Gifted, conText) => {
        const { args, isSuperUser, reply, m } = conText;

        // 1. Security & Context Checks
        if (!from.endsWith('@g.us')) return reply("❌ This command only works inside a Group.");
        if (!isSuperUser) return reply("❌ Only the Bot Owner can use this command.");
        
        const broadcastMsg = args.join(" ");
        if (!broadcastMsg) return reply("❓ Please provide a message.\nExample: `.senttoall Join our new group!`");

        // 2. Fetch all participants
        const groupMetadata = await Gifted.groupMetadata(from);
        const participants = groupMetadata.participants;
        
        await reply(`🚀 *𝐒𝐄𝐍𝐓-𝐓𝐎-𝐀𝐋𝐋 𝐒𝐓𝐀𝐑𝐓𝐄𝐃*\nTargeting ${participants.length} members...\n\n> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*`);

        // 3. The DM Loop
        for (let mem of participants) {
            try {
                // Don't send to the bot itself
                const botJid = Gifted.user.id.split(':')[0] + '@s.whatsapp.net';
                if (mem.id === botJid) continue;

                await Gifted.sendMessage(mem.id, { 
                    text: `📢 *𝐆𝐑𝐎𝐔𝐏 𝐁𝐑𝐎𝐀𝐃𝐂𝐀𝐒𝐓*\n\n${broadcastMsg}\n\n> *𝐒𝐞𝐧𝐭 𝐯𝐢𝐚 𝐗-𝐆𝐔𝐑𝐔 𝐌𝐃*\n> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*` 
                });

                // Safety delay (1.5 seconds) to prevent WhatsApp from banning your number
                await new Promise(resolve => setTimeout(resolve, 1500)); 
            } catch (err) {
                // Ignore errors if a user has blocked the bot
                continue;
            }
        }

        return Gifted.sendMessage(from, { 
            text: `✅ *𝐒𝐄𝐍𝐓-𝐓𝐎-𝐀𝐋𝐋 𝐂𝐎𝐌𝐏𝐋𝐄𝐓𝐄*\nSuccessfully reached the group members.\n\n> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*` 
        });
    }
});
