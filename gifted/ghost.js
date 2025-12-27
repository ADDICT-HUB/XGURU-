const { evt } = require("../gift");
const config = require("../config");

evt.commands.push({
    pattern: "ghost",
    category: "owner",
    function: async (from, Gifted, { isSuperUser, reply, q }) => {
        if (!isSuperUser) return;
        // Logic to update config.js would go here
        reply(`Ghost Mode is currently: ${config.GHOST_MODE === "true" ? "ON" : "OFF"}\n\n> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*`);
    }
});

// PASSIVE LOGIC: Hooks into the index.js loop
evt.commands.push({
    on: "all",
    function: async (from, Gifted, m) => {
        if (config.GHOST_MODE !== "true") return;
        // This stops the 'read' receipt from being sent back to the sender
        await Gifted.sendPresenceUpdate('unavailable', from);
    }
});

