const { evt } = require("../gift");
const config = require("../config");

/* Simple rate limiter to avoid spam */
let lastTyping = {};

evt.commands.push({
    on: "all",
    function: async (from, Gifted, m) => {
        try {
            if (!from) return;
            if (m?.fromMe) return;
            if (from === "status@broadcast") return;

            if (config.AUTO_TYPING !== true && config.AUTO_TYPING !== "true") {
                return;
            }

            const now = Date.now();
            if (lastTyping[from] && now - lastTyping[from] < 3000) return;

            lastTyping[from] = now;

            await Gifted.sendPresenceUpdate("composing", from);
        } catch (err) {
            console.error("AutoTyping error:", err.message);
        }
    }
});
