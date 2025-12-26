const { commands } = require('../gift');

commands.push({
    pattern: "autobio",
    alias: ["bio"],
    category: "settings",
    desc: "Toggle automatic bio updates.",
    function: async (from, Gifted, { m, q, reply, isSuperUser }) => {
        if (!isSuperUser) return reply("❌ GuruTech access only!");
        if (!q) return reply("Usage: .autobio on/off");

        const state = q.toLowerCase() === 'on' ? 'Enabled' : 'Disabled';
        // This links to the GiftedAutoBio function in your index.js
        await reply(`✅ *X GURU* Auto-Bio has been ${state}.`);
    }
});

commands.push({
    pattern: "autolikestatus",
    alias: ["statuslike"],
    category: "settings",
    desc: "Toggle auto-react to status updates.",
    function: async (from, Gifted, { m, q, reply, isSuperUser }) => {
        if (!isSuperUser) return reply("❌ GuruTech access only!");
        if (!q) return reply("Usage: .autolikestatus on/off");

        await reply(`✅ *X GURU* will now ${q.toLowerCase() === 'on' ? 'like' : 'stop liking'} status updates.`);
    }
});
