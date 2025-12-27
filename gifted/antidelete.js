const { evt } = require("../gift");

// NI MBAYA 😅

// A local cache to store messages temporarily so we can recover them if deleted
const messageCache = new Map();

// ============================================
// 1. CACHE MESSAGES - FIXED
// ============================================
evt.commands.push({
    on: "message",
    dontAddCommandList: true,
    function: async (_from, Gifted, conText) => {
        try {
            const m = conText?.m;
            if (!m?.message) return;
            
            // Don't cache bot's own messages
            if (m.key.fromMe) return;
            
            const msgId = m.key.id;
            if (!msgId) return;
            
            // Cache the message with timestamp
            messageCache.set(msgId, {
                ...m,
                timestamp: Date.now()
            });
            
            // Auto-clean old messages (older than 30 minutes)
            setTimeout(() => {
                messageCache.delete(msgId);
            }, 30 * 60 * 1000); // 30 minutes
            
        } catch (err) {
            console.error("Anti-delete cache error:", err.message);
        }
    }
});

// ============================================
// 2. DETECT DELETED MESSAGES - FIXED
// ============================================
evt.commands.push({
    on: "message.delete",
    dontAddCommandList: true,
    function: async (_from, Gifted, conText) => {
        try {
            const m = conText?.m;
            if (!m?.message?.protocolMessage) return;
            
            const protocolMsg = m.message.protocolMessage;
            
            // Check if it's a message delete (type 0)
            if (protocolMsg.type === 0 && protocolMsg.key) {
                const targetId = protocolMsg.key.id;
                const originalData = messageCache.get(targetId);
                
                if (!originalData) {
                    console.log("No cached data for deleted message:", targetId);
                    return;
                }
                
                // Get sender info
                const senderJid = originalData.key.participant || originalData.key.remoteJid;
                const senderNumber = senderJid.split('@')[0];
                
                // Determine chat type
                const chatJid = originalData.key.remoteJid;
                const isGroup = chatJid.endsWith('@g.us');
                const chatName = isGroup ? "Group Chat" : "Private Chat";
                
                // Get bot's owner number from config or environment
                const config = require("../config");
                const ownerNumber = config.OWNER_NUMBER || process.env.OWNER_NUMBER;
                
                if (!ownerNumber) {
                    console.error("Owner number not configured for anti-delete");
                    return;
                }
                
                // Format owner JID
                const ownerJid = ownerNumber.includes('@') 
                    ? ownerNumber 
                    : `${ownerNumber}@s.whatsapp.net`;
                
                // Create anonymous report
                const report = `
🕵️‍♂️ *𝐀𝐍𝐓𝐈-𝐃𝐄𝐋𝐄𝐓𝐄 𝐀𝐂𝐓𝐈𝐕𝐀𝐓𝐄𝐃*

📱 *Sender:* @${senderNumber}
💬 *Chat:* ${chatName}
⏰ *Time:* ${new Date().toLocaleTimeString()}
📅 *Date:* ${new Date().toLocaleDateString()}

*𝐃𝐄𝐋𝐄𝐓𝐄𝐃 𝐌𝐄𝐒𝐒𝐀𝐆𝐄 𝐂𝐎𝐍𝐓𝐄𝐍𝐓:*
─────────────────────`;
                
                try {
                    // Send report header with mention
                    await Gifted.sendMessage(ownerJid, { 
                        text: report, 
                        mentions: [senderJid] 
                    });
                    
                    // Check message type and forward appropriately
                    const msgType = originalData.message;
                    
                    if (msgType.extendedTextMessage || msgType.conversation) {
                        // Text message
                        const textContent = msgType.extendedTextMessage?.text || 
                                          msgType.conversation || 
                                          "Unknown text content";
                        
                        await Gifted.sendMessage(ownerJid, { 
                            text: `📝 *Text Message:*\n${textContent}` 
                        });
                        
                    } else if (msgType.imageMessage || msgType.videoMessage || 
                              msgType.audioMessage || msgType.documentMessage) {
                        // Media message - try to forward
                        try {
                            await Gifted.copyNForward(ownerJid, originalData, false);
                        } catch (forwardError) {
                            await Gifted.sendMessage(ownerJid, { 
                                text: `📁 *Media Detected* (Could not forward)\n` +
                                      `Type: ${Object.keys(msgType)[0]?.replace('Message', '')}` 
                            });
                        }
                    } else {
                        // Other message types
                        await Gifted.sendMessage(ownerJid, { 
                            text: `📦 *Other Message Type*\n` +
                                  `Type: ${Object.keys(msgType)[0] || 'Unknown'}` 
                        });
                    }
                    
                    // Add footer
                    await Gifted.sendMessage(ownerJid, { 
                        text: `─────────────────────\n` +
                              `*Anti-Delete System*\n` +
                              `NI MBAYA 😅` 
                    });
                    
                    // Clean cache
                    messageCache.delete(targetId);
                    
                    console.log(`Anti-delete: Sent deleted message ${targetId} to owner`);
                    
                } catch (sendError) {
                    console.error("Failed to send anti-delete alert:", sendError.message);
                }
                
            }
            
        } catch (err) {
            console.error("Anti-delete detection error:", err.message);
        }
    }
});

// ============================================
// 3. ADD CLEANUP JOB (OPTIONAL)
// ============================================
setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [msgId, data] of messageCache.entries()) {
        if (now - data.timestamp > 30 * 60 * 1000) { // 30 minutes
            messageCache.delete(msgId);
            cleaned++;
        }
    }
    
    if (cleaned > 0) {
        console.log(`Anti-delete cache cleanup: Removed ${cleaned} old messages`);
    }
}, 60 * 60 * 1000); // Run every hour

console.log("✅ Anti-delete plugin loaded - NI MBAYA 😅");
