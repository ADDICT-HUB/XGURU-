const { evt } = require("../gift");
const fs = require("fs");
const path = require("path");
const configPath = path.join(__dirname, "../config.js");

evt.commands.push({
    pattern: "ghost",
    alias: ["readreceipt", "bluecheck"],
    category: "owner",
    function: async (from, Gifted, conText) => {
        const { isSuperUser, reply, m } = conText;
        if (!isSuperUser) return;

        const text = (m.body || m.text || "").toLowerCase();
        let config = require(configPath);

        if (text.includes("on")) {
            config.GHOST_MODE = "true";
            fs.writeFileSync(configPath, "module.exports = " + JSON.stringify(config, null, 4));
            return reply("👻 *𝐆𝐡𝐨𝐬𝐭 𝐌𝐨𝐝𝐞 𝐀𝐜𝐭𝐢𝐯𝐚𝐭𝐞𝐝*\nYou can now read messages without blue ticks.");
        } else if (text.includes("off")) {
            config.GHOST_MODE = "false";
            fs.writeFileSync(configPath, "module.exports = " + JSON.stringify(config, null, 4));
            return reply("👤 *𝐆𝐡𝐨𝐬𝐭 𝐌𝐨𝐝𝐞 𝐃𝐞𝐚𝐜𝐭𝐢𝐯𝐚𝐭𝐞𝐝*");
        } else {
            return reply(`📊 *𝐒𝐲𝐬𝐭𝐞𝐦 𝐌𝐨𝐧𝐢𝐭𝐨𝐫*\n\n𝐆𝐡𝐨𝐬𝐭 𝐌𝐨𝐝𝐞: ${config.GHOST_MODE === "true" ? "𝐎𝐍" : "𝐎𝐅𝐅"}\n\nUsage: .ghost on/off`);
        }
    }
});

// --- STANDALONE GHOST LOGIC ---
evt.commands.push({
    on: "all",
    function: async (from, Gifted, m) => {
        const config = require(configPath);
        if (config.GHOST_MODE !== "true") return;

        // Automatically sets the bot to 'Always Online'
        await Gifted.sendPresenceUpdate('available', from);

        // Intercepts and prevents sending 'read' (blue ticks)
        // Note: The bot will still see the message, but the sender won't get the blue tick.
        await Gifted.readMessages([m.key]); 
    }
});
