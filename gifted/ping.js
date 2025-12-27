const { evt } = require("../gift");
const os = require("os");

evt.commands.push({
    pattern: "ping",
    alias: ["speed", "latency"],
    category: "main",
    description: "Check bot response time and system info",
    usage: "ping",
    function: async (from, Gifted, conText) => {
        const { reply, react } = conText;
        
        try {
            // Start timing
            const start = Date.now();
            
            // Send initial message
            const msg = await reply("🚀 *𝐏𝐢𝐧𝐠𝐢𝐧𝐠...*");
            
            // Calculate response time
            const end = Date.now();
            const responseTime = end - start;
            
            // Get system info
            const totalMemory = (os.totalmem() / (1024 ** 3)).toFixed(2);
            const freeMemory = (os.freemem() / (1024 ** 3)).toFixed(2);
            const usedMemory = (totalMemory - freeMemory).toFixed(2);
            const memoryUsage = ((usedMemory / totalMemory) * 100).toFixed(1);
            
            const uptime = process.uptime();
            const hours = Math.floor(uptime / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = Math.floor(uptime % 60);
            const uptimeStr = `${hours}h ${minutes}m ${seconds}s`;
            
            // Determine speed quality
            let speedEmoji = "🟢";
            let speedText = "Excellent";
            
            if (responseTime > 1000) {
                speedEmoji = "🔴";
                speedText = "Slow";
            } else if (responseTime > 500) {
                speedEmoji = "🟡";
                speedText = "Average";
            } else if (responseTime > 200) {
                speedEmoji = "🟢";
                speedText = "Good";
            }
            
            // Build response message
            const responseMsg = 
                `╭━━━『 *𝐏𝐈𝐍𝐆 𝐑𝐄𝐒𝐔𝐋𝐓* 』━━━╮\n\n` +
                `${speedEmoji} *𝐒𝐩𝐞𝐞𝐝:* ${responseTime}ms\n` +
                `📊 *𝐐𝐮𝐚𝐥𝐢𝐭𝐲:* ${speedText}\n\n` +
                `╭━━━『 *𝐒𝐘𝐒𝐓𝐄𝐌 𝐈𝐍𝐅𝐎* 』━━━╮\n\n` +
                `💾 *𝐑𝐀𝐌:* ${usedMemory}GB / ${totalMemory}GB (${memoryUsage}%)\n` +
                `⏱️ *𝐔𝐩𝐭𝐢𝐦𝐞:* ${uptimeStr}\n` +
                `⚙️ *𝐏𝐥𝐚𝐭𝐟𝐨𝐫𝐦:* ${os.platform()}\n\n` +
                `╰━━━━━━━━━━━━━━━━━━╯\n\n` +
                `> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*`;
            
            // React based on speed
            await react(speedEmoji);
            
            // Edit the message with results
            await Gifted.sendMessage(from, { 
                text: responseMsg,
                edit: msg.key 
            });
            
        } catch (error) {
            console.error("Ping command error:", error);
            
            // Fallback if edit fails
            try {
                const fallbackTime = Date.now() - start;
                await reply(
                    `🛰️ *𝐑𝐞𝐬𝐩𝐨𝐧𝐬𝐞:* ${fallbackTime}ms\n\n` +
                    `> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*`
                );
            } catch (err) {
                await reply("❌ *Failed to measure ping*");
            }
        }
    }
});

// Additional: System status command
evt.commands.push({
    pattern: "status",
    alias: ["botstatus", "systeminfo", "sysinfo"],
    category: "main",
    description: "Check detailed bot system status",
    usage: "status",
    function: async (from, Gifted, conText) => {
        const { reply, react } = conText;
        
        try {
            await react("⚙️");
            
            // Get detailed system info
            const totalMemory = (os.totalmem() / (1024 ** 3)).toFixed(2);
            const freeMemory = (os.freemem() / (1024 ** 3)).toFixed(2);
            const usedMemory = (totalMemory - freeMemory).toFixed(2);
            const memoryUsage = ((usedMemory / totalMemory) * 100).toFixed(1);
            
            const cpus = os.cpus();
            const cpuModel = cpus[0].model;
            const cpuCores = cpus.length;
            
            const uptime = process.uptime();
            const days = Math.floor(uptime / 86400);
            const hours = Math.floor((uptime % 86400) / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = Math.floor(uptime % 60);
            
            let uptimeStr = "";
            if (days > 0) uptimeStr += `${days}d `;
            if (hours > 0) uptimeStr += `${hours}h `;
            uptimeStr += `${minutes}m ${seconds}s`;
            
            const platform = os.platform();
            const arch = os.arch();
            const nodeVersion = process.version;
            
            // Get load average (Unix-like systems)
            const loadAvg = os.loadavg().map(l => l.toFixed(2)).join(", ");
            
            const statusMsg = 
                `╭━━━『 *𝐁𝐎𝐓 𝐒𝐓𝐀𝐓𝐔𝐒* 』━━━╮\n\n` +
                `✅ *𝐒𝐭𝐚𝐭𝐮𝐬:* Online\n` +
                `⏱️ *𝐔𝐩𝐭𝐢𝐦𝐞:* ${uptimeStr}\n\n` +
                `╭━━━『 *𝐌𝐄𝐌𝐎𝐑𝐘* 』━━━╮\n\n` +
                `💾 *𝐓𝐨𝐭𝐚𝐥 𝐑𝐀𝐌:* ${totalMemory}GB\n` +
                `📊 *𝐔𝐬𝐞𝐝 𝐑𝐀𝐌:* ${usedMemory}GB\n` +
                `🆓 *𝐅𝐫𝐞𝐞 𝐑𝐀𝐌:* ${freeMemory}GB\n` +
                `📈 *𝐔𝐬𝐚𝐠𝐞:* ${memoryUsage}%\n\n` +
                `╭━━━『 *𝐂𝐏𝐔* 』━━━╮\n\n` +
                `⚙️ *𝐌𝐨𝐝𝐞𝐥:* ${cpuModel.substring(0, 30)}...\n` +
                `🔢 *𝐂𝐨𝐫𝐞𝐬:* ${cpuCores}\n` +
                `📊 *𝐋𝐨𝐚𝐝:* ${loadAvg}\n\n` +
                `╭━━━『 *𝐒𝐘𝐒𝐓𝐄𝐌* 』━━━╮\n\n` +
                `🖥️ *𝐏𝐥𝐚𝐭𝐟𝐨𝐫𝐦:* ${platform}\n` +
                `🏗️ *𝐀𝐫𝐜𝐡:* ${arch}\n` +
                `🟢 *𝐍𝐨𝐝𝐞.𝐣𝐬:* ${nodeVersion}\n\n` +
                `╰━━━━━━━━━━━━━━━━━━╯\n\n` +
                `> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*`;
            
            await reply(statusMsg);
            await react("✅");
            
        } catch (error) {
            console.error("Status command error:", error);
            await react("❌");
            await reply("❌ *Failed to fetch system status*");
        }
    }
});
