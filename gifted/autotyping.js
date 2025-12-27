const { evt } = require("../gift");
const config = require("../config");

/* Rate limiter */
const lastTyping = {};

evt.commands.push({
    on: "all",

    function: async (_from, Gifted, conText) => {
        try {
            const m = conText?.m;
            if (!m?.key) return;

            const jid = m.key.remoteJid;
            if (!jid) return;

            if (m.key.fromMe) return;
            if (jid === "status@broadcast") return;

            if (config.AUTO_TYPING !== true && config.AUTO_TYPING !== "true") {
                return;
            }

            const now = Date.now();
            if (lastTyping[jid] && now - lastTyping[jid] < 3000) return;

            lastTyping[jid] = now;

            await Gifted.sendPresenceUpdate("composing", jid);
        } catch (err) {
            console.error("AutoTyping error:", err);
        }
    }
});
