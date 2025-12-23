const { evt } = require("../gift");

evt.commands.push({
  pattern: "autoviewstatus",
  desc: "Toggle Auto-View Status",
  react: "👁️",
  type: "user",
  async function(from, bot, args, context) {
    const current = context.config.AUTO_READ_STATUS === "true" ? "enabled" : "disabled";
    await context.reply(`Auto-View Status is currently ${current}`);
  },
});
