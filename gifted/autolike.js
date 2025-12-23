const { evt } = require("../gift");

evt({
  pattern: "autolike",
  desc: "Enable/disable auto like status",
  category: "owner"
}, async (Gifted, m, { reply, isSuperUser, config, args }) => {

  if (!isSuperUser) return reply("❌ Owner only");

  if (!args[0]) return reply(`💛 Auto Like Status: *${config.AUTO_LIKE_STATUS}*\nUse: .autolike on/off`);

  const value = args[0].toLowerCase();
  if (!["on","off"].includes(value)) return reply("❌ Use on or off");

  config.AUTO_LIKE_STATUS = value === "on" ? "true" : "false";

  reply(`✅ Auto Like Status set to *${value}*`);
});
