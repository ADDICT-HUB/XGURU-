const { evt } = require("../gift");

evt.commands.push({
  pattern: "ping",
  react: "🏓",
  function: async (from, Gifted, conText) => {
    conText.reply("✅ Pong! Bot is alive.");
  }
});
