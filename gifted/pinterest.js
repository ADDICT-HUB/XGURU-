const { evt } = require("../gift");
const axios = require("axios");

evt.commands.push({
    pattern: "pinterest",
    desc: "Download media from Pinterest",
    react: "📌",
    type: "download",
    async function(from, bot, args, context) {
        if (!args[0]) return bot.sendMessage(from, { text: "Please provide a Pinterest link!" });

        try {
            const url = args[0];
            // Using a reliable 2025 API for Pinterest
            const response = await axios.get(`https://api.guruapi.tech/download/pinterest?url=${encodeURIComponent(url)}`);
            const data = response.data.result;

            if (data.type === 'video') {
                await bot.sendMessage(from, { video: { url: data.url }, caption: "Pinterest Video Downloaded ✅" }, { quoted: context.m || null });
            } else {
                await bot.sendMessage(from, { image: { url: data.url }, caption: "Pinterest Image Downloaded ✅" }, { quoted: context.m || null });
            }
        } catch (err) {
            await bot.sendMessage(from, { text: "❌ Failed to download. Make sure the link is valid." });
        }
    }
});
