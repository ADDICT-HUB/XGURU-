const { evt } = require("../gift");
const config = require("../config");
const fs = require("fs");
const path = require("path");

// Store mode state
let botMode = config.MODE || "public"; // Default to public

// Helper function to update config file
const updateConfigMode = (newMode) => {
    try {
        const configPath = path.join(__dirname, "../config.js");
        let configContent = fs.readFileSync(configPath, "utf8");
        
        // Update MODE value in config
        if (configContent.includes("MODE:")) {
            configContent = configContent.replace(
                /MODE:\s*["'].*?["']/,
                `MODE: "${newMode}"`
            );
        } else if (configContent.includes("MODE =")) {
            configContent = configContent.replace(
                /MODE\s*=\s*["'].*?["']/,
                `MODE = "${newMode}"`
            );
        }
        
        fs.writeFileSync(configPath, configContent, "utf8");
        config.MODE = newMode;
        botMode = newMode;
        return true;
    } catch (err) {
        console.error("Failed to update config:", err);
        return false;
    }
};

// Command to change mode
evt.commands.push({
    name: "mode",
    description: "Switch bot mode between public and private",
    category: "owner",
    usage: "mode <public|private>",
    function: async (sock, m, { args, isOwner, reply }) => {
        try {
            // Check if user is owner
            if (!isOwner) {
                return await reply("❌ This command is only for bot owner!");
            }
            
            const newMode = args[0]?.toLowerCase();
            
            // Show current mode if no argument
            if (!newMode) {
                return await reply(
                    `*Current Mode:* ${botMode.toUpperCase()}\n\n` +
                    `📌 *Usage:* ${config.PREFIX}mode <public|private>\n\n` +
                    `*Modes:*\n` +
                    `• *public* - Bot responds to everyone\n` +
                    `• *private* - Bot responds only to owner`
                );
            }
            
            // Validate mode
            if (newMode !== "public" && newMode !== "private") {
                return await reply(
                    "❌ Invalid mode! Use:\n" +
                    `• ${config.PREFIX}mode public\n` +
                    `• ${config.PREFIX}mode private`
                );
            }
            
            // Check if already in that mode
            if (botMode === newMode) {
                return await reply(`✅ Bot is already in *${newMode.toUpperCase()}* mode!`);
            }
            
            // Update mode
            const updated = updateConfigMode(newMode);
            
            if (updated) {
                await reply(
                    `✅ Mode changed successfully!\n\n` +
                    `*Previous:* ${botMode === "private" ? "PUBLIC" : "PRIVATE"}\n` +
                    `*Current:* ${newMode.toUpperCase()}\n\n` +
                    `${newMode === "private" ? "🔒 Bot will now respond only to owner" : "🌍 Bot will now respond to everyone"}`
                );
            } else {
                botMode = newMode; // Update in memory even if file update fails
                await reply(
                    `⚠️ Mode changed to *${newMode.toUpperCase()}* but couldn't save to config file.\n` +
                    `This will reset after restart.`
                );
            }
            
        } catch (err) {
            console.error("Mode command error:", err);
            await reply("❌ An error occurred while changing mode.");
        }
    }
});

// Middleware to enforce mode restrictions
evt.commands.push({
    on: "all",
    function: async (_from, Gifted, conText) => {
        try {
            const m = conText?.m;
            if (!m?.key) return;
            if (m.key.fromMe) return;
            
            const jid = m.key.remoteJid;
            if (!jid) return;
            if (jid === "status@broadcast") return;
            
            // Update mode from config on each message
            botMode = config.MODE || "public";
            
            // If in private mode, check if sender is owner
            if (botMode === "private" || botMode === "PRIVATE") {
                const isOwner = conText?.isOwner || false;
                
                if (!isOwner) {
                    // Block command execution for non-owners in private mode
                    const messageText = m.message?.conversation || 
                                      m.message?.extendedTextMessage?.text || "";
                    
                    const prefix = config.PREFIX || ".";
                    
                    // Only respond if it's a command attempt
                    if (messageText.startsWith(prefix)) {
                        await Gifted.sendMessage(jid, {
                            text: "🔒 *Bot is in Private Mode*\n\nOnly the owner can use commands right now."
                        }, { quoted: m });
                        
                        // Stop further command processing
                        conText.stopExecution = true;
                    }
                }
            }
            
        } catch (err) {
            console.error("Mode middleware error:", err);
        }
    }
});
