const { evt } = require("../gift"); 
const fs = require("fs");
const path = require("path");
const { monospace } = require("../gift/gmdFunctions");

const configPath = path.join(__dirname, "../config.js");

evt.commands.push({
    pattern: "autoviewstatus",
    alias: ["avs", "statusview"],
    desc: "Toggle Auto-View Status for X GURU",
    react: "👁️",
    category: "owner",
    async function(from, bot, args, context) {
        // 1. Safety Check
        if (!context || !bot) return;

        // 2. Load Fresh Config
        let config;
        try {
            delete require.cache[require.resolve(configPath)];
            config = require(configPath);
        } catch (e) {
            console.error("Config Load Error:", e);
            return await bot.sendMessage(from, { text: "❌ Error: Could not read config.js file." });
        }

        const arg = args[0]?.toLowerCase();
        let statusMessage = "";

        // 3. Logic Handling
        if (arg === "on") {
            config.AUTO_READ_STATUS = "true";
            fs.writeFileSync(configPath, "module.exports = " + JSON.stringify(config, null, 4));
            statusMessage = "✅ *X GURU* Auto-View Status: ENABLED";
        } else if (arg === "off") {
            config.AUTO_READ_STATUS = "false";
            fs.writeFileSync(configPath, "module.exports = " + JSON.stringify(config, null, 4));
            statusMessage = "❌ *X GURU* Auto-View Status: DISABLED";
        } else {
            const current = config.AUTO_READ_STATUS === "true" ? "ACTIVE" : "INACTIVE";
            statusMessage = `📊 *Status Monitor*\nCurrent State: ${current}\n\n*Usage:*\n.autoviewstatus on\n.autoviewstatus off`;
        }

        // 4. Modern Branded Response
        const finalMsg = `
╔════════════════════════╗
   🌟 *AUTO VIEW CONTROL* 🌟
╠════════════════════════╣
  ${statusMessage}
╠════════════════════════╣
   🔗 *GuruTech Supreme*
╚════════════════════════╝
*Note:* NI MBAYA 😅`;

        await bot.sendMessage(from, { 
            text: monospace(finalMsg),
            contextInfo: {
                externalAdReply: {
                    title: "X GURU AUTOMATION",
                    body: "NI MBAYA 😅",
                    thumbnail: await bot.getFileBuffer(config.BOT_PIC || ""), 
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: context.m });
    },
});
