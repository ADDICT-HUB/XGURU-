const { evt } = require("../gift");
const config = require("../config");

evt.commands.push({
    on: "body",
    function: async (from, Gifted, m) => {
        if (m.fromMe) return;

        // Keywords that trigger the auto-reply
        const keywords = ["link", "join", "group", "channel"];
        const body = (m.body || "").toLowerCase();

        if (keywords.some(word => body === word)) {
            const joinMsg = `
👋 *𝐇𝐞𝐥𝐥𝐨 @${m.sender.split('@')[0]}*

𝐲𝐨𝐮 𝐰𝐚𝐧𝐭 𝐭𝐨 𝐣𝐨𝐢𝐧 𝐨𝐮𝐫 𝐜𝐨𝐦𝐦𝐮𝐧𝐢𝐭𝐲? 
𝐂𝐥𝐢𝐜𝐤 𝐭𝐡𝐞 𝐥𝐢𝐧𝐤 𝐛𝐞𝐥𝐨𝐰 𝐭𝐨 𝐬𝐭𝐚𝐲 𝐮𝐩𝐝𝐚𝐭𝐞𝐝!

📢 *𝐎𝐟𝐟𝐢𝐜𝐢𝐚𝐥 𝐂𝐡𝐚𝐧𝐧𝐞𝐥:*
${config.newsletterUrl || "https://whatsapp.com/channel/0029VbBNUAFFXUuUmJdrkj1f"}

> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*`;

            return await Gifted.sendMessage(from, { 
                text: joinMsg,
                mentions: [m.sender]
            }, { quoted: m });
        }
    }
});

// > *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*
