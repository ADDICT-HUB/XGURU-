const { evt } = require("../gift");

evt.commands.push({
    pattern: "dashboard",
    desc: "Show bot status and active features",
    category: "owner",
    react: "📊",
    async function(from, Gifted, conText) {
        const { reply, config } = conText;
        
        const status = (val) => val === "true" ? "✅ ON" : "❌ OFF";

        let dash = `*══✪〘 ${config.BOT_NAME} DASHBOARD 〙✪══*\n\n`;
        dash += `🤖 *Bot Name:* ${config.BOT_NAME}\n`;
        dash += `👑 *Owner:* ${config.OWNER_NAME}\n`;
        dash += `⚙️ *Mode:* ${config.MODE}\n`;
        dash += `📌 *Prefix:* [ ${config.PREFIX} ]\n\n`;
        
        dash += `*—［ AUTOMATION ］—*\n`;
        dash += `⌨️ *Auto Typing:* ${status(config.AUTO_TYPING)}\n`;
        dash += `🎙️ *Auto Record:* ${status(config.AUTO_RECORDING)}\n`;
        dash += `📖 *Auto Read Status:* ${status(config.AUTO_READ_STATUS)}\n`;
        dash += `❤️ *Auto Like Status:* ${status(config.AUTO_LIKE_STATUS)}\n`;
        dash += `🧬 *Auto Bio:* ${status(config.AUTO_BIO)}\n\n`;
        
        dash += `*—［ PROTECTION ］—*\n`;
        dash += `🛡️ *Antilink:* ${config.ANTILINK}\n`;
        dash += `🗑️ *Antidelete:* ${config.ANTIDELETE}\n`;
        dash += `📞 *Anticall:* ${status(config.ANTICALL)}\n`;
        dash += `👋 *Welcome:* ${status(config.WELCOME_MESSAGE)}\n\n`;
        
        dash += `*Runtime:* ${process.uptime().toFixed(0)} seconds\n`;
        dash += `© ${new Date().getFullYear()} ${config.FOOTER}`;

        reply(dash);
    }
});
