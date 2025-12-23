module.exports = async (evt, Gifted) => {
    try {
        if (!evt || !evt.messages) return;
        for (let msg of evt.messages) {
            if (msg.key && msg.key.id && msg.messageStubType === 68) {
                // 68 = deleted message
                await Gifted.sendMessage(msg.key.remoteJid, {
                    text: `⚠️ Someone deleted a message! Original: ${JSON.stringify(msg.message)}`,
                });
            }
        }
    } catch (err) {
        console.error("antideletestatus error:", err);
    }
};
