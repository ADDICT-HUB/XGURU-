const { evt } = require("../gift");

evt.commands.push({
    pattern: "tagall",
    alias: ["everyone", "all"],
    desc: "Tag all members in the group.",
    react: "📣",
    category: "group",
    function: async (from, Gifted, conText) => {
        const { isGroup, isAdmin, reply, groupMetadata } = conText;

        if (!isGroup) return reply("❌ This command only works in groups.");
        if (!isAdmin) return reply("❌ This command is for **Admins** only.");

        const participants = groupMetadata.participants;
        let message = `✨ *𝐗-𝐆𝐔𝐑𝐔 𝐌𝐃 𝐓𝐀𝐆-𝐀𝐋𝐋* ✨\n\n📢 *𝐌𝐞𝐬𝐬𝐚𝐠𝐞:* ${conText.args.join(" ") || "No Message"}\n\n`;

        for (let mem of participants) {
            message += `⋄ @${mem.id.split('@')[0]}\n`;
        }

        message += `\n> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*`;

        await Gifted.sendMessage(from, { 
            text: message, 
            mentions: participants.map(a => a.id) 
        }, { quoted: conText.m });
    }
});
