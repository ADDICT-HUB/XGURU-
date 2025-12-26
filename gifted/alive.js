const { evt } = require("../gift");
const config = require("../config");
const { monospace, runtime, getPerformanceInfo } = require("../gift/gmdFunctions");
const fs = require("fs");
const axios = require("axios");

async function getThumbnailBuffer(pathOrUrl) {
  try {
    if (!pathOrUrl) return null;

    // Remote image
    if (pathOrUrl.startsWith("http")) {
      const res = await axios.get(pathOrUrl, { responseType: "arraybuffer" });
      return Buffer.from(res.data);
    }

    // Local file
    if (fs.existsSync(pathOrUrl)) {
      return fs.readFileSync(pathOrUrl);
    }

    return null;
  } catch (err) {
    console.error("Thumbnail load failed:", err.message);
    return null;
  }
}

evt.commands.push({
  pattern: "alive",
  alias: ["bot", "status"],
  react: "👑",
  desc: "Check if X GURU is active.",
  category: "main",

  function: async (from, Gifted, conText) => {
    const perf = getPerformanceInfo();
    const botName = config.BOT_NAME || "𝐗-𝐆𝐔𝐑𝐔 𝐌𝐃";
    const dev = "GuruTech";
    
    // Calculate Speed/Ping
    const start = Date.now();
    const ping = Date.now() - start;

    const aliveMsg = `
✨ *${botName} 𝐒𝐓𝐀𝐓𝐔𝐒* ✨

╔════════════════════════╗
  *『 𝐒𝐘𝐒𝐓𝐄𝐌 𝐈𝐍𝐅𝐎𝐑𝐌𝐀𝐓𝐈𝐎𝐍 』*
  
  ⋄ 𝐒𝐭𝐚𝐭𝐮𝐬   : 𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅
  ⋄ 𝐔𝐩𝐭𝐢𝐦𝐞   : ${runtime(process.uptime())}
  ⋄ 𝐒𝐩𝐞𝐞𝐝    : ${ping}𝐦𝐬
  ⋄ 𝐑𝐀𝐌      : ${perf.ram}
  ⋄ 𝐂𝐏𝐔      : ${perf.cpuLoad}%
  ⋄ 𝐌𝐨𝐝𝐞     : ${config.MODE || "𝐏𝐮𝐛𝐥𝐢𝐜"}
  ⋄ 𝐎𝐰𝐧𝐞𝐫    : ${dev}
╚════════════════════════╝

> *${config.CAPTION || "𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐗-𝐆𝐔𝐑𝐔 𝐓𝐞𝐜𝐡"}*
> *Developed by Maurice Gift*`;

    const thumbnail = await getThumbnailBuffer("https://files.catbox.moe/52699c.jpg");

    await Gifted.sendMessage(
      from,
      {
        text: aliveMsg,
        contextInfo: {
          externalAdReply: {
            title: "𝐗-𝐆𝐔𝐑𝐔 𝐌𝐃 𝐕𝟓 𝐈𝐒 𝐎𝐍𝐋𝐈𝐍𝐄",
            body: "𝐒𝐭𝐚𝐭𝐮𝐬: 𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅",
            thumbnail,
            sourceUrl: "https://whatsapp.com/channel/0029Vb3hlgX5kg7G0nFggl0Y",
            mediaType: 1,
            renderLargerThumbnail: true
          }
        }
      },
      { quoted: conText.m }
    );
  }
});
