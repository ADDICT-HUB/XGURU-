const { evt } = require("../gift");
const translate = require('@vitalets/google-translate-api'); // npm install @vitalets/google-translate-api

evt.commands.push({
    pattern: "trt",
    alias: ["translate"],
    category: "skills",
    function: async (from, Gifted, conText) => {
        const { args, quoted, reply } = conText;
        
        // Use quoted text or the arguments
        const textToTranslate = args.join(" ") || (quoted ? quoted.text : null);
        if (!textToTranslate) return reply("❓ Reply to a message or type text to translate.");

        try {
            const result = await translate(textToTranslate, { to: 'en' });
            const msg = `
🌍 *𝐒𝐊𝐈𝐋𝐋: 𝐓𝐑𝐀𝐍𝐒𝐋𝐀𝐓𝐎𝐑*

⋄ *From:* ${result.from.language.iso}
⋄ *Result:* ${result.text}

> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*`;
            return reply(msg);
        } catch (e) {
            reply("❌ Translation skill failed. Check your connection.");
        }
    }
});
