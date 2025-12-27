const { evt } = require("../gift");
const fs = require("fs");
const path = require("path");
const configPath = path.join(__dirname, "../config.js");

evt.commands.push({
    pattern: "autobio",
    category: "owner",
    function: async (from, Gifted, conText) => {
        const { isSuperUser, reply, arg } = conText;
        if (!isSuperUser) return;

        const input = (arg[0] || "").toLowerCase();
        delete require.cache[require.resolve(configPath)];
        let config = require(configPath);

        if (input === "on") {
            config.AUTO_BIO = "true";
            fs.writeFileSync(configPath, `module.exports = ${JSON.stringify(config, null, 4)};`);
            
            // Force an immediate update so you see it right away
            const date = new Date();
            const time = date.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' });
            const bio = `X-GURU MD ⚡ Active: ${time} | 🇰🇪`;
            await Gifted.updateProfileStatus(bio);
            
            return reply("✅ *𝐀𝐮𝐭𝐨-𝐁𝐢𝐨: 𝐀𝐂𝐓𝐈𝐕𝐄*\nBio updated successfully! It will now refresh every minute.");
        } else if (input === "off") {
            config.AUTO_BIO = "false";
            fs.writeFileSync(configPath, `module.exports = ${JSON.stringify(config, null, 4)};`);
            return reply("🚫 *𝐀𝐮𝐭𝐨-𝐁𝐢𝐨: 𝐃𝐄𝐀𝐂𝐓𝐈𝐕𝐀𝐓𝐄𝐃*");
        } else {
            return reply(`📊 *𝐒𝐭𝐚𝐭𝐮𝐬:* ${config.AUTO_BIO === "true" ? "ON" : "OFF"}\nUsage: .autobio on`);
        }
    }
});
