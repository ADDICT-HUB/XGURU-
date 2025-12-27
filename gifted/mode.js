const { gmd, evt } = require("../gift");
const config = require("../config");
const fs = require("fs");
const path = require("path");

// NI MBAYA 😅

// Store mode state
let botMode = config.MODE || "public"; // Default to public

// Helper function to update config file
const updateConfigMode = (newMode) => {
    try {
        const configPath = path.join(__dirname, "../config.js");
        let configContent = fs.readFileSync(configPath, "utf8");
        
        // Update MODE value in config
        const patterns = [
            /MODE:\s*["'].*?["']/,
            /MODE\s*=\s*["'].*?["']/,
            /MODE:\s*(public|private)/,
            /MODE\s*=\s*(public|private)/
        ];
        
        let updated = false;
        for (const pattern of patterns) {
            if (pattern.test(configContent)) {
                if (pattern.toString().includes(":")) {
                    configContent = configContent.replace(pattern, `MODE: "${newMode}"`);
                } else {
                    configContent = configContent.replace(pattern, `MODE = "${newMode}"`);
                }
                updated = true;
                break;
            }
        }
        
        // If MODE doesn't exist, add it
        if (!updated) {
            if (configContent.includes("module.exports")) {
                configContent = configContent.replace(
                    /(module\.exports\s*=\s*{[^}]*)(})/s,
                    `$1  MODE: "${newMode}",\n$2`
                );
            }
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

// Command to change mode - FIXED: Using gmd() instead of evt.commands.push
gmd(
    {
        pattern: "mode",
        description: "Switch bot mode between public and private",
        category: "owner",
        usage: "mode <public|private>",
        react: "🔧",
        alias: ["botmode", "setmode"]
    },
    async (from, Gifted, conText) => {
        try {
            const { reply, isSuperUser, text, botPrefix } = conText;
            
            // Check if user is owner/superuser
            if (!isSuperUser) {
                return await reply("❌ *Owner Only Command!*");
            }
            
            const args = text ? text.trim().split(/\s+/).filter(Boolean) : [];
            const newMode = args[0]?.toLowerCase();
            
            // Show current mode if no argument
            if (!newMode) {
                const modeInfo = botMode === "private" 
                    ? "🔒 *PRIVATE* - Only you can use commands"
                    : "🌍 *PUBLIC* - Everyone can use commands";
                
                return await reply(
                    `*🤖 Bot Mode Status*\n\n` +
                    `📊 *Current Mode:* ${modeInfo}\n\n` +
                    `⚙️ *Usage:* ${botPrefix || '.'}mode <public|private>\n\n` +
                    `📖 *Mode Types:*\n` +
                    `• *public* - Bot responds to everyone\n` +
                    `• *private* - Bot responds only to owner\n\n` +
                    `💡 *Example:* ${botPrefix || '.'}mode private`
                );
            }
            
            // Validate mode
            if (newMode !== "public" && newMode !== "private") {
                return await reply(
                    "❌ *Invalid Mode!*\n\n" +
                    `Please choose:\n` +
                    `• ${botPrefix || '.'}mode public\n` +
                    `• ${botPrefix || '.'}mode private`
                );
            }
            
            // Check if already in that mode
            if (botMode === newMode) {
                return await reply(
                    `ℹ️ Bot is already in *${newMode.toUpperCase()}* mode!\n\n` +
                    `No changes needed.`
                );
            }
            
            const oldMode = botMode;
            
            // Update mode
            const updated = updateConfigMode(newMode);
            
            if (updated) {
                await reply(
                    `✅ *Mode Changed Successfully!*\n\n` +
                    `🔄 *Previous:* ${oldMode.toUpperCase()}\n` +
                    `🎯 *Current:* ${newMode.toUpperCase()}\n\n` +
                    (newMode === "private" 
                        ? "🔒 *Bot is now in PRIVATE mode*\nOnly you (owner) can use commands."
                        : "🌍 *Bot is now in PUBLIC mode*\nEveryone can use commands.")
                );
            } else {
                botMode = newMode; // Update in memory even if file update fails
                await reply(
                    `⚠️ *Mode Changed (Temporary)*\n\n` +
                    `Mode set to *${newMode.toUpperCase()}* but couldn't save to config file.\n` +
                    `This change will reset after bot restart.\n\n` +
                    `Please check file permissions.`
                );
            }
            
        } catch (err) {
            console.error("Mode command error:", err);
            await reply("❌ *An error occurred while changing mode.*");
        }
    }
);

// ============================================
// MODE RESTRICTION MIDDLEWARE - OPTIMIZED
// ============================================

// Remove any existing mode middleware to avoid duplicates
evt.commands = evt.commands.filter(cmd => {
    // Keep commands with patterns (actual commands)
    if (cmd.pattern || cmd.name) return true;
    // Remove old mode middleware
    if (cmd.on === "all" && cmd.function?.toString().includes("private mode")) return false;
    return true;
});

// Add optimized mode restriction middleware
evt.commands.push({
    on: "message",
    dontAddCommandList: true,
    function: async (_from, Gifted, conText) => {
        try {
            const m = conText?.m;
            if (!m?.key) return;
            if (m.key.fromMe) return; // Skip bot's own messages
            
            const jid = m.key.remoteJid;
            if (!jid || jid.endsWith("@broadcast") || jid.includes("@newsletter")) return;
            
            // Get current mode from config
            botMode = config.MODE || "public";
            
            // Skip if mode is public
            if (botMode === "public" || botMode === "PUBLIC") return;
            
            // Only enforce for private mode
            if (botMode === "private" || botMode === "PRIVATE") {
                const isOwner = conText?.isSuperUser || false;
                
                if (!isOwner) {
                    // Check if message is a command attempt
                    const messageText = m.message?.conversation || 
                                      m.message?.extendedTextMessage?.text || 
                                      "";
                    
                    const prefix = config.PREFIX || ".";
                    
                    // If it's a command attempt by non-owner
                    if (messageText.trim().startsWith(prefix)) {
                        // Send private mode message
                        await Gifted.sendMessage(jid, {
                            text: "🔒 *Bot is in Private Mode*\n\n" +
                                  "Only the owner can use commands right now.\n\n" +
                                  "*NI MBAYA 😅*"
                        }, { quoted: m });
                        
                        // Mark to prevent further command processing
                        conText.stopProcessing = true;
                        return true; // Stop execution chain
                    }
                }
            }
            
            return false; // Continue normal processing
            
        } catch (err) {
            console.error("Mode middleware error:", err);
            return false; // Don't block execution on error
        }
    }
});

// Log loading
console.log("✅ Mode plugin loaded - NI MBAYA 😅");
