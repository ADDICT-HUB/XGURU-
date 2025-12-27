const { evt } = require("../gift");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const configPath = path.join(__dirname, "../config.js");

/* Load thumbnail safely */
async function getThumbnailBuffer(url) {
    try {
        if (!url) return null;
        const res = await axios.get(url, { responseType: "arraybuffer" });
        return Buffer.from(res.data);
    } catch (e) {
        console.error("Thumbnail error:", e.message);
        return null;
    }
}

evt.commands.push({
    pattern: "autolikestatus",
    alias: ["als", "statusreact"],
    desc: "Toggle Auto-Like Status",
    react: "❤️",
    category: "owner",

    function: async (from, Gifted, conText) => {
        const {
            isSuperUser,
            reply,
            botName,
            botCaption,
            newsletterUrl,
            botPrefix,
            text
        } = conText;

        if (!isSuperUser) {
            return reply("❌ This command is restricted to the Owner.");
        }

        // ✅ FRAMEWORK-SAFE ARG PARSING
        const option = text
            ?.trim()
            ?.split(/\s+/)[1]
            ?.toLowerCase();

        // Reload config cleanly
        delete require.cache[require.resolve(configPath)];
        const config = require(configPath);

        if (option !== "on" && option !== "off") {
            return reply(
                `📊 *CURRENT STATUS:* ${
                    config.AUTO_LIKE_STATUS ? "ON" : "OFF"
                }\n\n` +
                `*Usage:*\n` +
                `${botPrefix}autolikestatus on\n` +
                `${botPrefix}autolikestatus off\n\n` +
                `> *NI MBAYA 😅*`
            );
        }

        config.AUTO_LIKE_STATUS = option === "on";

        fs.writeFileSync(
            configPath,
            "module.exports = " + JSON.stringify(config, null, 4)
        );

        const statusText = option === "on" ? "𝐄𝐍𝐀𝐁𝐋𝐄𝐃" : "𝐃𝐈𝐒𝐀𝐁𝐋𝐄𝐃";

        const message = `
✨ *𝐗-𝐆𝐔𝐑𝐔 𝐌𝐃 𝐂𝐎𝐍𝐓𝐑𝐎𝐋* ✨

╔════════════════════════╗
  *『 𝐒𝐓𝐀𝐓𝐔𝐒 𝐀𝐔𝐓𝐎𝐌𝐀𝐓𝐈𝐎𝐍 』*

  ⋄ 𝐌𝐨𝐝𝐮𝐥𝐞 : 𝐀𝐮𝐭𝐨 𝐋𝐢𝐤𝐞
  ⋄ 𝐒𝐭𝐚𝐭𝐮𝐬 : ${statusText}
  ⋄ 𝐒𝐲𝐬𝐭𝐞𝐦 : 𝐗-𝐆𝐔𝐑𝐔 𝐕𝟓
╚════════════════════════╝

> ${botCaption}
> Developed by GuruTech
> NI MBAYA 😅`;

        const thumbnail = await getThumbnailBuffer(
            "https://files.catbox.moe/atpgij.jpg"
        );

        await Gifted.sendMessage(
            from,
            {
                text: message,
                contextInfo: thumbnail
                    ? {
                          externalAdReply: {
                              title: `${botName} AUTOMATION`,
                              body: "𝐒𝐭𝐚𝐭𝐮𝐬: 𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅",
                              thumbnail,
                              sourceUrl: newsletterUrl,
                              mediaType: 1,
                              renderLargerThumbnail: true
                          }
                      }
                    : {}
            },
            { quoted: conText.m }
        );
    }
});
