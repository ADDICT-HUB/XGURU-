evt.commands.push({
    pattern: "autorecord",
    desc: "Toggle Auto-Record/Typing",
    react: "🎙️",
    type: "user",
    async function(from, Gifted, args, conText) {
        const reply = async (text) => {
            await Gifted.sendMessage(from, { text }, { quoted: conText.m });
        };

        let configPath = path.join(__dirname, "../config.js");
        let config = require(configPath);

        const arg = args[0]?.toLowerCase();
        if (!arg || !["on","off"].includes(arg)) {
            return await reply("Usage: .autorecord on/off");
        }

        config.DM_PRESENCE = arg === "on" ? "recording" : "online";
        config.GC_PRESENCE = arg === "on" ? "recording" : "online";

        fs.writeFileSync(configPath, "module.exports = " + JSON.stringify(config, null, 4));
        delete require.cache[require.resolve(configPath)];

        await reply(`✅ Auto-Record/Typing is now ${config.DM_PRESENCE === "recording" ? "enabled" : "disabled"}`);
    }
});
