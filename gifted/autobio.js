const { evt } = require("../gift");
const fs = require("fs");
const path = require("path");
const configPath = path.join(__dirname, "../config.js");

// 1. THE COMMAND (To Toggle On/Off)
evt.commands.push({
    pattern: "autobio",
    alias: ["abio"],
    category: "owner",
    function: async (from, Gifted, conText) => {
        const { isSuperUser, reply, m, botPrefix } = conText;
        if (!isSuperUser) return;

        const text = (m.body || m.text || "").toLowerCase();
        
        // Load fresh config
        delete require.cache[require.resolve(configPath)];
        let config = require(configPath);

        if (text.includes("on")) {
            config.AUTO_BIO = "true";
            fs.writeFileSync(configPath, "module.exports = " + JSON.stringify(config, null, 4));
            return reply(`✅ *𝐀𝐮𝐭𝐨-𝐁𝐢𝐨 𝐄𝐧𝐚𝐛𝐥𝐞𝐝*\n${config.botName || 'Bot'} will now update your bio every minute.`);
        } else if (text.includes("off")) {
            config.AUTO_BIO = "false";
            fs.writeFileSync(configPath, "module.exports = " + JSON.stringify(config, null, 4));
            return reply("❌ *𝐀𝐮𝐭𝐨-𝐁𝐢𝐨 𝐃𝐢𝐬𝐚𝐛𝐥𝐞𝐝*");
        } else {
            const status = config.AUTO_BIO === "true" ? "𝐀𝐂𝐓𝐈𝐕𝐄" : "𝐈𝐍𝐀𝐂𝐓𝐈𝐕𝐄";
            return reply(`📊 *𝐒𝐲𝐬𝐭𝐞𝐦 𝐌𝐨𝐧𝐢𝐭𝐨𝐫*\n\n𝐂𝐮𝐫𝐫𝐞𝐧𝐭 𝐒𝐭𝐚𝐭𝐞: ${status}\n\nUsage: ${botPrefix}autobio on/off`);
        }
    }
});

// 2. THE BACKGROUND LOOP (Self-Starting)
setInterval(async () => {
    try {
        // Load config inside the interval to catch name changes
        delete require.cache[require.resolve(configPath)];
        const config = require(configPath);
        
        if (config.AUTO_BIO !== "true") return;

        // Get current Time and Date
        const date = new Date();
        const time = date.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' });
        const day = date.toLocaleDateString('en-GB', { weekday: 'long' });
        const botName = config.botName || "X-GURU MD";

        // Your custom Bio content with Bot Name
        const newBio = `${botName} ⚡ Active: ${time} | Day: ${day} | NI MBAYA 😅`;

        // Update the WhatsApp Bio
        await Gifted.updateProfileStatus(newBio);

    } catch (err) {
        // Silently fail if connection isn't ready
    }
}, 60000); // Runs every 60 seconds
