const { evt } = require("../gift");

evt.commands.push({
  pattern: "autorecordtyping",
  desc: "Toggle Auto-Record Typing",
  react: "🎤",
  type: "user",
  async function(from, bot, args, context) {
    const typingMode = context.config.DM_PRESENCE || "online";
    await context.reply(`Auto-Presence (Typing/Recording) is currently: ${typingMode}`);
  },
});
