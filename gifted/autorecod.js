const { evt } = require("../gift");
const config = require("../config");

evt.commands.push({
    on: "all",
    function: async (from, Gifted, m) => {
        if (!from || m.fromMe || from === 'status@broadcast') return;

        if (config.AUTO_RECORDING === "true") {
            try {
                await Gifted.sendPresenceUpdate('recording', from);
            } catch (e) {
                console.error("Recording presence error:", e);
            }
        }
    }
});

// > *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*
