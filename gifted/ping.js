const { evt } = require("../gift");

evt.commands.push({
  pattern: "ping",
  react: "🏓",
  desc: "Check if the bot is active",
  category: "main",
  function: async (from, Gifted, conText) => {
    const start = new Date().getTime();
    
    // Initial response
    const mass = await Gifted.sendMessage(from, { 
      text: "Testing Speed... 💨" 
    }, { quoted: conText.m });

    const end = new Date().getTime();
    const responseTime = end - start;

    // Final response with unique font for your note
    await Gifted.sendMessage(from, {
      text: `*✅ PONG!!*\n\n*🚀 Latency:* ${responseTime}ms\n*🕒 Status:* Active\n\n> \`NI MBAYA 😅\``,
      edit: mass.key
    });
  }
});
