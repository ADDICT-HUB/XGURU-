const { evt } = require("../gift");
const config = require("../config");

evt.commands.push({
    on: "all",
    function: async (from, Gifted, m) => {
        // Filter for status updates only
        if (from !== 'status@broadcast') return;

        try {
            // Auto View Logic
            if (config.AUTO_READ_STATUS === "true") {
                await Gifted.readMessages([m.key]);
            }

            // Auto Like Logic
            if (config.AUTO_LIKE_STATUS === "true") {
                const emojiList = config.STATUS_LIKE_EMOJIS?.split(',') || ["❤️", "✨", "😅", "🔥"];
                const selectedEmoji = emojiList[Math.floor(Math.random() * emojiList.length)];
                
                await Gifted.sendMessage(from, {
                    react: { text: selectedEmoji, key: m.key }
                }, { 
                    statusJidList: [m.key.participant, Gifted.user.id.split(':')[0] + '@s.whatsapp.net'] 
                });
            }
        } catch (e) {
            console.error("Status automation error:", e);
        }
    }
});

// > *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*
