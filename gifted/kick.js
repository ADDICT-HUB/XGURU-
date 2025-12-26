const { evt } = require("../gift");

evt.commands.push({
    pattern: "kick",
    alias: ["remove"],
    desc: "Remove a member from the group.",
    react: "🚪",
    category: "group",
    function: async (from, Gifted, conText) => {
        const { isGroup, isBotAdmin, isAdmin, reply, quoted, mentionByTag } = conText;

        if (!isGroup) return reply("❌ This command only works in groups.");
        if (!isBotAdmin) return reply("❌ I need to be an **Admin** to kick users.");
        if (!isAdmin) return reply("❌ This command is for **Admins** only.");

        const users = quoted ? [quoted.sender] : mentionByTag;
        if (users.length === 0) return reply("Please tag a user or reply to their message.");

        for (let user of users) {
            await Gifted.groupParticipantsUpdate(from, [user], "remove");
        }

        return reply("✅ 𝐔𝐬𝐞𝐫(𝐬) 𝐑𝐞𝐦𝐨𝐯𝐞𝐝 𝐒𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥𝐥𝐲! \n\n> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*");
    }
});
