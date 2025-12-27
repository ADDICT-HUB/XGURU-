const { evt } = require("../gift");

evt.commands.push({
    pattern: "vanish",
    desc: "Send a message that self-destructs",
    category: "advanced",
    function: async (from, Gifted, conText) => {
        const { args, reply, isSuperUser } = conText;
        if (!isSuperUser) return;

        const seconds = parseInt(args[0]);
        const text = args.slice(1).join(" ");

        if (isNaN(seconds) || !text) return reply("Usage: .vanish [seconds] [message]\nExample: .vanish 10 This will disappear!");

        const sentMsg = await Gifted.sendMessage(from, { 
            text: `📝 *𝐒𝐄𝐋𝐅-𝐃𝐄𝐒𝐓𝐑𝐔𝐂𝐓 𝐌𝐄𝐒𝐒𝐀𝐆𝐄*\n\n${text}\n\n⏱️ _Disappearing in ${seconds} seconds..._` 
        });

        // Advanced: Timer to delete the message automatically
        setTimeout(async () => {
            await Gifted.sendMessage(from, { 
                delete: sentMsg.key 
            });
        }, seconds * 1000);
    }
});
