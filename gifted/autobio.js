const evt = require("../gift"); 
const fs = require("fs");
const path = require("path");

evt.commands.push({
    pattern: "autobio",
    desc: "Toggle Auto-Bio",
    react: "📝",
    type: "user",
    async function(from, Gifted, args, conText) {
        // SAFETY CHECK: Define the quoted message safely
        // If conText.m doesn't exist, we just don't quote anything
        const quotedMsg = conText && conText.m ? conText.m : null;

        const reply = async (text) => {
            await Gifted.sendMessage(from, { text }, { quoted: quotedMsg });
        };

        let configPath = path.join(__dirname, "../config.js");
        
        // Use a try-catch for the config to prevent crashes if file is missing
        let config;
        try {
            config = require(configPath);
        } catch (e) {
            return await reply("❌ Error: Could not find config.js file.");
        }

        const arg = args[0]?.toLowerCase();
        if (!arg || !["on","off"].includes(arg)) {
            return await reply("Usage: .autobio on/off");
        }

        // Update the value
        config.AUTO_BIO = arg === "on" ? "true" : "false";

        try {
            // Write changes to file
            fs.writeFileSync(configPath, "module.exports = " + JSON.stringify(config, null, 4));
            // Clear cache so the bot sees the change immediately
            delete require.cache[require.resolve(configPath)];

            await reply(`✅ Auto-Bio is now ${arg === "on" ? "enabled" : "disabled"}`);
        } catch (err) {
            await reply("❌ Failed to save configuration.");
            console.error(err);
        }
    }
});
