const { evt } = require("../gift");
const fs = require("fs");
const path = require("path");
const configPath = path.join(__dirname, "../config.js");

evt.commands.push({
    pattern: "autoviewstatus",
    alias: ["autoview", "avstatus"], // Added aliases in case you type it short
    category: "owner",
    function: async (from, Gifted, conText) => {
        const { arg, isSuperUser, reply } = conText;
        if (!isSuperUser) return;

        // Use 'on' by default if no argument is provided to avoid 'undefined' errors
        const input = (arg[0] || "on").toLowerCase();
        
        delete require.cache[require.resolve(configPath)];
        let config = require(configPath);

        if (input === "on") {
            config.AUTO_READ_STATUS = "true";
            fs.writeFileSync(configPath, `module.exports = ${JSON.stringify(config, null, 4)};`);
            return reply("👁️ *𝐀𝐔𝐓𝐎-𝐕𝐈𝐄𝐖 𝐒𝐓𝐀𝐓𝐔𝐒: 𝐀𝐂𝐓𝐈𝐕𝐄*\nBot will now view all statuses automatically.\n\n> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*");
        } else if (input === "off") {
            config.AUTO_READ_STATUS = "false";
            fs.writeFileSync(configPath, `module.exports = ${JSON.stringify(config, null, 4)};`);
            return reply("🚫 *𝐀𝐔𝐓𝐎-𝐕𝐈𝐄𝐖 𝐒𝐓𝐀𝐓𝐔𝐒: 𝐃𝐄𝐀𝐂𝐓𝐈𝐕𝐀𝐓𝐄𝐃*\n\n> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*");
        } else {
            return reply(`📊 *𝐒𝐭𝐚𝐭𝐮𝐬:* ${config.AUTO_READ_STATUS === "true" ? "ON" : "OFF"}\nUsage: .autoviewstatus on/off\n\n> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*`);
        }
    }
});
