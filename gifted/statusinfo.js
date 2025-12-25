const { evt } = require("../gift");

// Global counters for the session
global.statusViews = global.statusViews || 0;
global.statusLikes = global.statusLikes || 0;
global.statusReplies = global.statusReplies || 0;

evt.commands.push({
    pattern: "statusinfo",
    alias: ["statstats", "sv"],
    desc: "Show Auto Status statistics",
    category: "main",
    react: "📊",
    function: async (from, Gifted, conText) => {
        const { botName } = conText;
        
        let report = `*══✪ [ STATUS REPORT ] ✪══*\n\n`;
        report += `👤 *Bot:* ${conText.config.BOT_NAME}\n`;
        report += `👀 *Statuses Viewed:* ${global.statusViews}\n`;
        report += `❤️ *Statuses Liked:* ${global.statusLikes}\n`;
        report += `💬 *Replies Sent:* ${global.statusReplies}\n\n`;
        report += `🚀 *Status:* Monitoring Active\n`;
        report += `*══✪ [ GURUTECH ] ✪══*\n`;
        report += `> \`NI MBAYA 😅\``;

        await Gifted.sendMessage(from, { 
            text: report,
            contextInfo: {
                externalAdReply: {
                    title: "Status Monitor System",
                    body: "Tracking your auto-view activity",
                    thumbnail: await Gifted.getBuffer(conText.config.BOT_PIC),
                    mediaType: 1,
                    renderLargerThumbnail: false
                }
            }
        }, { quoted: conText.m });
    }
});
