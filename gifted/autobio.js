const { evt } = require("../gift");
const fs = require("fs");
const path = require("path");
const configPath = path.join(__dirname, "../config.js");

evt.commands.push({
    pattern: "autobio",
    desc: "Toggle live time in bot bio",
    category: "owner",
    function: async (from, Gifted, conText) => {
        const { isSuperUser, reply, arg } = conText;
        if (!isSuperUser) return;

        const input = (arg[0] || "").toLowerCase();
        
        // Clear cache and load current config
        delete require.cache[require.resolve(configPath)];
        let config = require(configPath);

        if (input === "on") {
            config.AUTO_BIO = "true";
            fs.writeFileSync(configPath, `module.exports = ${JSON.stringify(config, null, 4)};`);
            return reply("✅ *𝐀𝐮𝐭𝐨-𝐁𝐢𝐨: 𝐀𝐂𝐓𝐈𝐕𝐄*\nBot bio will now update with live time every minute.\n\n> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*");
        } else if (input === "off") {
            config.AUTO_BIO = "false";
            fs.writeFileSync(configPath, `module.exports = ${JSON.stringify(config, null, 4)};`);
            return reply("🚫 *𝐀𝐮𝐭𝐨-𝐁𝐢𝐨: 𝐈𝐍𝐀𝐂𝐓𝐈𝐕𝐄*");
        } else {
            return reply(`📊 *𝐒𝐲𝐬𝐭𝐞𝐦 𝐌𝐨𝐧𝐢𝐭𝐨𝐫*\n\n𝐂𝐮𝐫𝐫𝐞𝐧𝐭 𝐒𝐭𝐚𝐭𝐞: ${config.AUTO_BIO === "true" ? "𝐀𝐂𝐓𝐈𝐕𝐄" : "𝐈𝐍𝐀𝐂𝐓𝐈𝐕𝐄"}\n𝐔𝐬𝐚𝐠𝐞: .autobio on/off\n\n> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*`);
        }
    }
});
