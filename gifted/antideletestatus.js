evt.commands.push({
    pattern: "antideletestatus",
    desc: "Toggle Anti-Delete Status",
    react: "🚫",
    type: "user",
    async function(from, Gifted, args, conText) {
        const reply = async (text) => {
            await Gifted.sendMessage(from, { text }, { quoted: conText.m });
        };

        let configPath = path.join(__dirname, "../config.js");
        let config = require(configPath);

        const arg = args[0]?.toLowerCase();
        if (!arg || !["on","off"].includes(arg)) {
            return await reply("Usage: .antideletestatus on/off");
        }

        config.ANTIDELETE = arg === "on" ? "all" : "false"; // change "all" or "indm" as per your bot

        fs.writeFileSync(configPath, "module.exports = " + JSON.stringify(config, null, 4));
        delete require.cache[require.resolve(configPath)];

        await reply(`✅ Anti-Delete Status is now ${config.ANTIDELETE !== "false" ? "enabled" : "disabled"}`);
    }
});
