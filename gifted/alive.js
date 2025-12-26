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
    const botName = config.BOT_NAME || "X GURU";
    const dev = "GuruTech";

    const aliveMsg = `
╔════════════════════════╗
   🌟 *${botName} IS ONLINE* 🌟
╠════════════════════════╣
  👤 *Developer:* ${dev}
  ⏳ *Uptime:* ${runtime(process.uptime())}
  📟 *RAM:* ${perf.ram}
  📈 *CPU:* ${perf.cpuLoad}%
  📡 *Mode:* ${config.MODE || "Public"}
  🛡️ *Protection:* Active
╚════════════════════════╝
   *NI MBAYA 😅*`;

    const thumbnail = await getThumbnailBuffer(config.BOT_PIC);

    await Gifted.sendMessage(
      from,
      {
        text: monospace(aliveMsg),
        contextInfo: thumbnail
          ? {
              externalAdReply: {
                title: `${botName} V2.0 POWERED BY GURUTECH`,
                body: "SYSTEM STATUS: EXCELLENT",
                thumbnail,
                sourceUrl: "https://whatsapp.com/channel/0029VaYV9sIIyPtSe9Z6d63v",
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
