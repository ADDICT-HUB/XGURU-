const { evt } = require("../gift");

// A local cache to store messages temporarily so we can recover them if deleted
const messageCache = new Map();

// 1. LISTENER: Save every message into temporary cache
evt.commands.push({
    on: "all",
    function: async (from, Gifted, m) => {
        // Only cache messages with actual content
        if (m.message) {
            const msgId = m.key.id;
            messageCache.set(msgId, m);
            
            // Clean cache every 30 minutes to save RAM
            setTimeout(() => messageCache.delete(msgId), 1800000);
        }
    }
});

// 2. LISTENER: Detect when a message is deleted
evt.commands.push({
    on: "protocolMessage",
    function: async (from, Gifted, m) => {
        // Check if the protocol message is a 'delete' action
        if (m.message.protocolMessage && m.message.protocolMessage.type === 0) {
            const targetId = m.message.protocolMessage.key.id;
            const originalData = messageCache.get(targetId);

            if (originalData) {
                const sender = originalData.key.participant || originalData.key.remoteJid;
                const chatName = from.endsWith('@g.us') ? "Group Chat" : "Private Chat";
                
                // --- SEND TO YOUR INBOX ANONYMOUSLY ---
                const ownerJid = Gifted.user.id.split(':')[0] + '@s.whatsapp.net';
                
                const report = `
🕵️‍♂️ *𝐀𝐍𝐎𝐍𝐘𝐌𝐎𝐔𝐒 𝐀𝐍𝐓𝐈-𝐃𝐄𝐋𝐄𝐓𝐄*

⋄ *𝐅𝐫𝐨𝐦:* @${sender.split('@')[0]}
⋄ *𝐂𝐡𝐚𝐭:* ${chatName}
⋄ *𝐓𝐢𝐦𝐞:* ${new Date().toLocaleTimeString()}

*𝐌𝐞𝐬𝐬𝐚𝐠𝐞 𝐂𝐨𝐧𝐭𝐞𝐧𝐭 𝐁𝐞𝐥𝐨𝐰:*
---------------------------`;

                // Send the report header
                await Gifted.sendMessage(ownerJid, { text: report, mentions: [sender] });

                // Forward the actual deleted message (Image, Text, Video, etc.)
                await Gifted.copyNForward(ownerJid, originalData, false);
                
                // Clear from cache after recovery
                messageCache.delete(targetId);
            }
        }
    }
});
