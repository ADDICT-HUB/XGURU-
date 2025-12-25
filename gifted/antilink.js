const { evt } = require("../gift");

evt.commands.push({
    pattern: "antilink",
    desc: "Enable/Disable Antilink in groups",
    react: "🛡️",
    type: "group",
    async function(from, bot, args, context) {
        if (!context.isGroup) return bot.sendMessage(from, { text: "This command is only for groups!" });
        if (!context.isBotAdmin) return bot.sendMessage(from, { text: "I need to be an Admin to enforce Antilink!" });
        if (!context.isAdmin) return bot.sendMessage(from, { text: "Only group admins can use this." });

        const arg = args[0]?.toLowerCase();
        let config = require("../config"); // Assuming you store settings here or in a DB

        if (arg === "on") {
            // Logic to save 'true' to your database/config for this specific JID
            await bot.sendMessage(from, { text: "✅ Antilink is now ENABLED for this group." });
        } else if (arg === "off") {
            await bot.sendMessage(from, { text: "❌ Antilink is now DISABLED." });
        } else {
            await bot.sendMessage(from, { text: "Usage: .antilink on/off" });
        }
    }
});
