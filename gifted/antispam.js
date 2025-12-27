const { evt } = require("../gift");
const config = require("../config");

const usedCommandRecently = new Map();

evt.commands.push({
    on: "all",
    function: async (from, Gifted, m) => {
        if (config.ANTISPAM !== "true" || m.fromMe) return;

        const sender = m.sender || m.key.remoteJid;
        const now = Date.now();
        const userData = usedCommandRecently.get(sender) || { count: 0, lastTime: 0 };

        if (now - userData.lastTime < 5000) {
            userData.count++;
        } else {
            userData.count = 1;
        }

        userData.lastTime = now;
        usedCommandRecently.set(sender, userData);

        if (userData.count > 3) {
            return Gifted.sendMessage(from, { 
                text: `⚠️ *𝐀𝐍𝐓𝐈-𝐒𝐏𝐀𝐌 𝐖𝐀𝐑𝐍𝐈𝐍𝐆*\n@${sender.split('@')[0]}, please slow down! \n\n> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*`,
                mentions: [sender]
            });
        }
    }
});
