const { evt } = require("../gift");

// Helper function to handle presence
async function setPresence(bot, from, type) {
    // types: 'composing' (typing), 'recording' (audio recording), 'paused'
    await bot.sendPresenceUpdate(type, from);
}

evt.commands.push({
    pattern: "autotyping",
    desc: "Toggle Auto-Typing presence",
    type: "user",
    async function(from, bot, args, context) {
        let config = require("../config");
        config.AUTO_TYPING = args[0] === "on" ? "true" : "false";
        await bot.sendMessage(from, { text: `Autotyping is ${config.AUTO_TYPING === "true" ? "ON" : "OFF"}` });
    }
});

evt.commands.push({
    pattern: "autorecord",
    desc: "Toggle Auto-Recording presence",
    type: "user",
    async function(from, bot, args, context) {
        let config = require("../config");
        config.AUTO_RECORD = args[0] === "on" ? "true" : "false";
        await bot.sendMessage(from, { text: `Autorecording is ${config.AUTO_RECORD === "true" ? "ON" : "OFF"}` });
    }
});
