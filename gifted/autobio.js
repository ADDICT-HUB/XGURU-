const { evt } = require("../gift");
const fs = require("fs");
const path = require("path");

const configPath = path.join(__dirname, "../config.js");

evt.commands.push({
    pattern: "autobio",
    alias: ["abio"],
    desc: "Toggle Auto-Bio update for X-GURU MD",
    react: "📝",
    category: "owner",
    function: async (from, Gifted, conText) => {
        // --- IMPROVED SELF-HEALING LOGIC ---
        const { isSuperUser, reply, botName, botCaption, newsletterUrl, botPrefix, m } = conText;
        
        // 1. Get the raw text (e.g., ".autobio on")
        const textBody = m?.body || m?.text || "";
        
        // 2. Force extract arguments by splitting the text manually
        // This takes everything after the first word
        const manualArgs = textBody.trim().split(/\s+/).slice(1);
        
        // 3. Use conText.args if it exists, otherwise use our manual extraction
        const args = (conText.args && conText.args.length > 0) ? conText.args : manualArgs;
        const arg = args[0]?.toLowerCase(); 
        // ----------------------------------
        
        if (!isSuperUser) return reply("❌ This command is restricted to the Owner.");

        let config;
        try {
            delete require.cache[require.resolve(configPath)];
            config = require(configPath);
        } catch (e) {
            return await Gifted.sendMessage(from, { text: "❌ Error: Could not read config.js file." });
        }

        // Check if the user actually typed 'on' or 'off'
        if (arg === "on" || arg === "off") {
            config.AUTO_BIO = arg === "on" ? "true" : "false";
            fs.writeFileSync(configPath, "module.exports = " + JSON.stringify(config, null, 4));
            
            const status = arg === "on" ? "𝐄𝐍𝐀𝐁𝐋𝐄𝐃" : "𝐃𝐈𝐒𝐀𝐁𝐋𝐄𝐃";
            const finalMsg = `
✨ *𝐗-𝐆𝐔𝐑𝐔 𝐌𝐃 𝐂𝐎𝐍𝐓𝐑𝐎𝐋* ✨

╔════════════════════════╗
  *『 𝐏𝐑𝐎𝐅𝐈𝐋𝐄 𝐀𝐔𝐓𝐎𝐌𝐀𝐓𝐈𝐎𝐍 』*
  
  ⋄ 𝐌𝐨𝐝𝐮𝐥𝐞   : 𝐀𝐮𝐭𝐨 𝐁𝐢𝐨
  ⋄ 𝐒𝐭𝐚𝐭𝐮𝐬   : ${status}
  ⋄ 𝐒𝐲𝐬𝐭𝐞𝐦   : 𝐗-𝐆𝐔𝐑𝐔 𝐕𝟓
╚════════════════════════╝

> *${botCaption}*
> *Developed by GuruTech*
> *NI MBAYA 😅*`;

            return await Gifted.sendMessage(from, { 
                text: finalMsg,
                contextInfo: {
                    externalAdReply: {
                        title: `${botName} AUTOMATION`,
                        body: "𝐒𝐭𝐚𝐭𝐮𝐬: 𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅",
                        thumbnailUrl: "https://files.catbox.moe/atpgij.jpg",
                        sourceUrl: newsletterUrl,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m });
        } else {
            // This is what sends if 'arg' is undefined or empty
            const current = config.AUTO_BIO === "true" ? "𝐀𝐂𝐓𝐈𝐕𝐄" : "𝐈𝐍𝐀𝐂𝐓𝐈𝐕𝐄";
            return reply(`📊 *𝐒𝐲𝐬𝐭𝐞𝐦 𝐌𝐨𝐧𝐢𝐭𝐨𝐫*\n\n𝐂𝐮𝐫𝐫𝐞𝐧𝐭 𝐒𝐭𝐚𝐭𝐞: ${current}\n\n*𝐔𝐬𝐚𝐠𝐞:*\n${botPrefix}autobio on\n${botPrefix}autobio off\n\n*Debug:* I detected arg as: "${arg || 'empty'}"`);
        }
    }
});
