const { evt } = require("../gift");

evt.commands.push({
    pattern: "promote",
    desc: "Promote a member to Admin.",
    react: "👑",
    category: "group",
    function: async (from, Gifted, conText) => {
        const { isGroup, isBotAdmin, isAdmin, reply, quoted, mentionByTag } = conText;

        if (!isGroup) return reply("❌ This command only works in groups.");
        if (!isBotAdmin) return reply("❌ I need to be an **Admin** to promote users.");
        if (!isAdmin) return reply("❌ This command is for **Admins** only.");

        const users = quoted ? [quoted.sender] : mentionByTag;
        if (users.length === 0) return reply("Please tag a user or reply to their message.");

        for (let user of users) {
            await Gifted.groupParticipantsUpdate(from, [user], "promote");
        }

        const finalMsg = `
✨ *𝐗-𝐆𝐔𝐑𝐔 𝐌𝐃 𝐔𝐏𝐃𝐀𝐓𝐄* ✨
╔════════════════════════╗
  ⋄ 𝐀𝐜𝐭𝐢𝐨𝐧: 𝐏𝐫𝐨𝐦𝐨𝐭𝐞
  ⋄ 𝐒𝐭𝐚𝐭𝐮𝐬: 𝐍𝐞𝐰 𝐀𝐝𝐦𝐢𝐧 𝐀𝐝𝐝𝐞𝐝
╚════════════════════════╝
> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*`;

        return reply(finalMsg);
    }
});
