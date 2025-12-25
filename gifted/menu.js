const { evt } = require("../gift");
const config = require("../config");

evt.commands.push({
  pattern: "menu",
  alias: ["help", "list"],
  react: "⚡",
  desc: "Show the bot command list",
  category: "main",
  function: async (from, Gifted, conText) => {
    const { BOT_NAME, OWNER_NAME, PREFIX } = config;
    
    // Identity Branding
    const dev = "GuruTech";
    const note = " `NI MBAYA 😅` ";
    
    const time = new Date().toLocaleTimeString();
    const date = new Date().toLocaleDateString();

    let menuText = `*══✪ [ ${BOT_NAME.toUpperCase()} ] ✪══*\n\n`;
    
    menuText += `👤 *Developer:* ${dev}\n`;
    menuText += `🕒 *Time:* ${time}\n`;
    menuText += `📆 *Date:* ${date}\n`;
    menuText += `⌨️ *Prefix:* [ ${PREFIX} ]\n`;
    menuText += `🚀 *Status:* Active\n\n`;
    
    menuText += `*───〔 🤖 AUTO FEATURES 〕───*\n`;
    menuText += `✨ Auto Status View/Like\n`;
    menuText += `🛡️ Anti-Delete System\n`;
    menuText += `📞 Anti-Call Protection\n`;
    menuText += `🔗 Anti-Link (Groups)\n`;
    menuText += `🤖 AI Chatbot Active\n\n`;

    menuText += `*───〔 💡 COMMANDS 〕───*\n`;
    menuText += `⚡ ${PREFIX}ping - Check speed\n`;
    menuText += `⚡ ${PREFIX}menu - Show this list\n`;
    menuText += `⚡ ${PREFIX}alive - Check bot status\n\n`;

    menuText += `*══✪ [ ${dev.toUpperCase()} ] ✪══*\n`;
    menuText += `> ${note}`;

    // Send the menu with the bot profile picture or a template
    await Gifted.sendMessage(from, {
      text: menuText,
      contextInfo: {
        externalAdReply: {
          title: `${BOT_NAME} Assistant`,
          body: `Developed by ${dev}`,
          thumbnail: await Gifted.getBuffer(config.BOT_PIC),
          sourceUrl: "https://github.com/GiftedTech",
          mediaType: 1,
          renderLargerThumbnail: true
        }
      }
    }, { quoted: conText.m });
  }
});
