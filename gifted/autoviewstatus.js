const { evt } = require("../gift"); // Fixed 'Const' to 'const'
const fs = require("fs");
const path = require("path");

// Use path.join for better reliability across different systems
const configPath = path.join(__dirname, "../config.js");

evt.commands.push({
    pattern: "autoviewstatus",
    desc: "Toggle Auto-View Status",
    react: "👁️",
    type: "user",
    async function(from, bot, args, context) {
        // Safety check to prevent the 'undefined' crash
        if (!context) return;

        let config;
        try {
            // Force delete cache before requiring to get fresh data
            delete require.cache[require.resolve(configPath)];
            config = require(configPath);
        } catch (e) {
            console.error("Config Error:", e);
            return await bot.sendMessage(from, { text: "❌ Error: Could not load config.js" });
        }

        const arg = args[0]?.toLowerCase();

        if (arg === "on") {
            config.AUTO_READ_STATUS = "true";
            fs.writeFileSync(configPath, "module.exports = " + JSON.stringify(config, null, 4));
            
            // Safer way to reply if context.reply is failing
            await bot.sendMessage(from, { text: "✅ Auto-View Status has been enabled" }, { quoted: context.m || null });
        } else if (arg === "off") {
            config.AUTO_READ_STATUS = "false";
            fs.writeFileSync(configPath, "module.exports = " + JSON.stringify(config, null, 4));
            
            await bot.sendMessage(from, { text: "❌ Auto-View Status has been disabled" }, { quoted: context.m || null });
        } else {
            const current = config.AUTO_READ_STATUS === "true" ? "enabled" : "disabled";
            await bot.sendMessage(from, { text: `Auto-View Status is currently: ${current}\n\nUsage: .autoviewstatus on/off` }, { quoted: context.m || null });
        }
    },
});
