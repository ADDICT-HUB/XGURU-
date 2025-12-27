const fs = require("fs");
const path = require("path");
const { gmd } = require("../gift");

const settingsPath = path.join(__dirname, "../settings.js");

gmd(
  {
    pattern: "autorecord",
    react: "🎙️",
    category: "owner",
    description: "Toggle Auto Recording + Typing"
  },
  async (from, Gifted, conText) => {
    const { reply, react, isSuperUser, config } = conText;

    if (!isSuperUser) {
      return reply("❌ Owner Only Command!");
    }

    try {
      /* Toggle value */
      const newValue = config.AUTO_RECORD === "true" ? "false" : "true";
      config.AUTO_RECORD = newValue;

      /* Update settings file safely */
      let fileContent = fs.readFileSync(settingsPath, "utf-8");

      if (/AUTO_RECORD\s*:/.test(fileContent)) {
        fileContent = fileContent.replace(
          /AUTO_RECORD\s*:\s*["'](true|false)["']/,
          `AUTO_RECORD: "${newValue}"`
        );
      } else {
        // If missing, append it safely
        fileContent += `\nAUTO_RECORD: "${newValue}",\n`;
      }

      fs.writeFileSync(settingsPath, fileContent);

      await react("✅");

      await reply(
        newValue === "true"
          ? "🎙️ Auto Recording + Typing ENABLED"
          : "⛔ Auto Recording + Typing DISABLED"
      );
    } catch (error) {
      console.error("autorecord error:", error);
      reply("❌ Failed to update Auto Recording setting.");
    }
  }
);
