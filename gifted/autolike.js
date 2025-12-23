const fs = require("fs");
const path = require("path");
const { gmd } = require("../gift");

const settingsPath = path.join(__dirname, "../settings.js");

gmd({
  pattern: "autolike",
  react: "❤️",
  category: "owner",
  description: "Toggle Auto Like Status",
}, async (from, Gifted, conText) => {
  const { reply, react, isSuperUser, config } = conText;
  if (!isSuperUser) return reply("❌ Owner Only Command!");

  try {
    const val = config.AUTO_LIKE_STATUS === "true" ? "false" : "true";
    config.AUTO_LIKE_STATUS = val;

    let txt = fs.readFileSync(settingsPath, "utf-8");
    txt = txt.replace(/AUTO_LIKE_STATUS\s*:\s*["'](true|false)["']/, `AUTO_LIKE_STATUS: "${val}"`);
    fs.writeFileSync(settingsPath, txt);

    await react("✅");
    reply(`❤️ Auto Like Status ${val === "true" ? "ENABLED" : "DISABLED"}`);
  } catch (e) {
    reply("❌ Failed");
  }
});
