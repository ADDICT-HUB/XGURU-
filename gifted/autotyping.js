const { evt } = require("../gift");
const config = require("../config");

evt.commands.push({
    on: "all",
    function: async (from, Gifted, m) => {
        if (!from || m.fromMe || from === 'status@broadcast') return;

        if (config.AUTO_TYPING === "true") {
            try {
                await Gifted.sendPresenceUpdate('composing', from);
            } catch (e) {
                console.error("Typing presence error:", e);
            }
        }
    }
});

// > *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*
