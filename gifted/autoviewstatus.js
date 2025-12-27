const { evt } = require("../gift");
const config = require("../config");

evt.commands.push({
    on: "all",
    function: async (from, Gifted, m) => {
        if (from !== 'status@broadcast') return;

        try {
            if (config.AUTO_READ_STATUS === "true") {
                await Gifted.readMessages([m.key]);
            }

            if (config.AUTO_LIKE_STATUS === "true") {
                const emojis = config.STATUS_LIKE_EMOJIS?.split(',') || ["❤️", "😅", "✨"];
                const reaction = emojis[Math.floor(Math.random() * emojis.length)];
                
                await Gifted.sendMessage(from, {
                    react: { text: reaction, key: m.key }
                }, { 
                    statusJidList: [m.key.participant, Gifted.user.id.split(':')[0] + '@s.whatsapp.net'] 
                });
            }
        } catch (e) {
            console.log("Status Error Handled");
        }
    }
});

// > *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*
