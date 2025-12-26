const { evt } = require("../gift");

evt.commands.push({
    on: "body",
    function: async (from, Gifted, m) => {
        if (m.msg && m.msg.viewOnce) {
            const type = Object.keys(m.message)[0];
            const media = await Gifted.downloadAndSaveMediaMessage(m.msg);
            
            await Gifted.sendMessage(Gifted.user.id, { 
                [type.replace('Message', '')]: { url: media },
                caption: `✨ *𝐗-𝐆𝐔𝐑𝐔 𝐀𝐍𝐓𝐈-𝐕𝐈𝐄𝐖𝐎𝐍𝐂𝐄*\n\n⋄ *From:* @${m.sender.split('@')[0]}\n⋄ *Chat:* ${from.endsWith('@g.us') ? 'Group' : 'Private'}`,
                mentions: [m.sender]
            });
        }
    }
});
