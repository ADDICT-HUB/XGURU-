const { evt } = require("../gift");
const axios = require("axios");

evt.commands.push({
    pattern: "read",
    alias: ["ocr", "vision"],
    category: "advanced",
    function: async (from, Gifted, conText) => {
        const { quoted, reply, m } = conText;
        if (!quoted || quoted.mtype !== 'imageMessage') return reply("❌ Please reply to an image.");

        await reply("🔍 *𝐒𝐜𝐚𝐧𝐧𝐢𝐧𝐠 𝐢𝐦𝐚𝐠𝐞... 𝐏𝐥𝐞𝐚𝐬𝐞 𝐰𝐚𝐢𝐭.*");

        try {
            // Download the media
            const media = await Gifted.downloadAndSaveMediaMessage(quoted);
            
            // Advanced: Using a free OCR API to extract text
            // Note: In a production bot, you'd use a private API key here
            const res = await axios.get(`https://api.ocr.space/parse/imageurl?apikey=helloworld&url=${media}`);
            const extractedText = res.data.ParsedResults[0].ParsedText;

            await reply(`📄 *𝐄𝐗𝐓𝐑𝐀𝐂𝐓𝐄𝐃 𝐓𝐄𝐗𝐓:*\n\n${extractedText || "No text found."}\n\n> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*`);
        } catch (e) {
            reply("❌ Failed to read image. Ensure the text is clear.");
        }
    }
});
