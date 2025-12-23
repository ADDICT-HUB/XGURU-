const { evt } = require("../gift");
const fs = require("fs");
const configPath = require.resolve("../config.js");

evt.commands.push({
    pattern: "antidelete",
    desc: "Toggle Anti-Delete Messages",
    react: "🛑",
    type: "user",
    async function(from, bot, args, context) {
        let config = require(configPath);
        const arg = args[0]?.toLowerCase();

        if (arg === "on") {
            config.ANTIDELETE = "true";
            fs.writeFileSync(configPath, "module.exports = " + JSON.stringify(config, null, 4));
            await context.reply("✅ Anti-Delete Messages has been enabled");
        } else if (arg === "off") {
            config.ANTIDELETE = "false";
            fs.writeFileSync(configPath, "module.exports = " + JSON.stringify(config, null, 4));
            await context.reply("❌ Anti-Delete Messages has been disabled");
        } else {
            const status = config.ANTIDELETE === "true" ? "enabled" : "disabled";
            await context.reply(`Anti-Delete Messages is currently: ${status}`);
        }

        delete require.cache[configPath];
    },
});
