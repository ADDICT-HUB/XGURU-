const { evt } = require("../gift");

evt.commands.push({
    pattern: "ping",
    category: "main",
    function: async (from, Gifted, { reply }) => {
        const start = Date.now();
        const msg = await reply("🚀 *𝐏𝐢𝐧𝐠𝐢𝐧𝐠...*");
        const end = Date.now();
        
        await Gifted.sendMessage(from, { 
            text: `🛰️ *𝐑𝐞𝐬𝐩𝐨𝐧𝐬𝐞:* ${end - start}𝐦𝐬\n\n> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*`,
            edit: msg.key 
        });
    }
});
