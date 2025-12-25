const fs = require("fs");
// Make sure this path is correct for your config
const config = require("../config");

module.exports = async (evt, Gifted) => {
    try {
        // 1. Safety Guard
        if (!evt || !evt.messages) return;
        
        // 2. Check if Antidelete is even enabled in your config
        // If you haven't added this to config yet, it will default to true
        const antiDeleteEnabled = config.ANTIDELETE === "true";
        if (!antiDeleteEnabled) return;

        for (let m of evt.messages) {
            // Check for 'protocolMessage' which is the signal for a deleted message
            if (m.message?.protocolMessage?.type === 0) {
                const key = m.message.protocolMessage.key;
                
                // This is the ID of the message that was deleted
                const deletedMsgId = key.id;
                
                // In Baileys, to see WHAT was deleted, your bot must have a store.
                // If you don't have a store, we can only notify that a message was deleted.
                
                let report = `*「 ANTI-DELETE DETECTED 」*\n\n`;
                report += `*From:* @${key.remoteJid.split("@")[0]}\n`;
                report += `*Message ID:* ${deletedMsgId}\n`;
                report += `*Time:* ${new Date().toLocaleString()}`;

                await Gifted.sendMessage(Gifted.user.id, { 
                    text: report, 
                    mentions: [key.remoteJid] 
                });
                
                // Note: To actually RE-SEND the deleted message content, 
                // your bot's main index.js must be saving messages to a JSON/Database store.
            }
        }
    } catch (err) {
        // Preventing the "undefined" crash you've been seeing
        console.error("Error in Anti-Delete process:", err);
    }
};
