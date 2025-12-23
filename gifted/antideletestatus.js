const { evt } = require("../gift");

evt.commands.push({
  pattern: "antideletestatus",
  desc: "Toggle Anti-Delete Status",
  react: "🛡️",
  type: "user",
  async function(from, bot, args, context) {
    const status = context.config.ANTIDELETE === "true" ? "enabled" : "disabled";
    await context.reply(`Anti-Delete Status is currently ${status}`);
  },
});
