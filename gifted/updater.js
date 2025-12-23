const { gmd } = require("../gift");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const AdmZip = require("adm-zip");

gmd({
    pattern: "update",
    alias: ["updatenow", "updt", "sync"],
    react: "🆕",
    desc: "Safely update the bot from GitHub",
    category: "owner",
    filename: __filename
}, async (from, Gifted, ctx) => {

    const {
        reply,
        react,
        isSuperUser,
        config,
        setCommitHash,
        getCommitHash
    } = ctx;

    if (!isSuperUser) {
        await react("❌");
        return reply("❌ *Owner only command*");
    }

    try {
        await reply("🔍 Checking for updates...");

        // 🔹 Normalize repo (convert full URL → owner/repo)
        let repo = config.BOT_REPO
            .replace("https://github.com/", "")
            .replace(".git", "")
            .trim();

        const apiUrl = `https://api.github.com/repos/${repo}/commits/main`;

        const { data } = await axios.get(apiUrl, {
            timeout: 15000,
            headers: { "User-Agent": "X-GURU-BOT" }
        });

        const latestHash = data.sha;
        const currentHash = await getCommitHash();

        if (latestHash && latestHash === currentHash) {
            return reply("✅ *Already on latest version*");
        }

        const commitInfo = `
🆕 *New Update Found*

👤 Author: ${data.commit.author.name}
📅 Date: ${new Date(data.commit.author.date).toLocaleString()}
💬 Message:
${data.commit.message}
`;

        await reply(commitInfo);

        // 🔹 Download ZIP
        const zipUrl = `https://github.com/${repo}/archive/refs/heads/main.zip`;
        const zipPath = path.join(__dirname, "..", "update.zip");
        const extractPath = path.join(__dirname, "..", "update_tmp");

        const zipRes = await axios.get(zipUrl, {
            responseType: "arraybuffer",
            timeout: 20000
        });

        fs.writeFileSync(zipPath, zipRes.data);

        // 🔹 Extract
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(extractPath, true);

        // 🔹 Detect extracted folder automatically
        const extractedFolder = fs
            .readdirSync(extractPath)
            .find(f => fs.lstatSync(path.join(extractPath, f)).isDirectory());

        if (!extractedFolder) {
            throw new Error("Invalid update package");
        }

        const sourcePath = path.join(extractPath, extractedFolder);
        const targetPath = path.join(__dirname, "..");

        // 🔹 Protected files/folders
        const exclude = [
            ".env",
            "gift/session",
            "node_modules",
            "gift/database.db"
        ];

        copySafe(sourcePath, targetPath, exclude);

        await setCommitHash(latestHash);

        // 🔹 Cleanup
        fs.removeSync(zipPath);
        fs.removeSync(extractPath);

        await reply("✅ *Update complete*\n♻ Restarting bot...");

        setTimeout(() => process.exit(0), 2000);

    } catch (err) {
        console.error("UPDATE ERROR:", err);
        return reply("❌ *Update failed*\nTry manual redeploy.");
    }
});

/* ================= SAFE COPY ================= */

function copySafe(src, dest, exclude) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

    for (const item of fs.readdirSync(src)) {
        if (exclude.some(e => item.startsWith(e))) continue;

        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);

        if (fs.lstatSync(srcPath).isDirectory()) {
            copySafe(srcPath, destPath, exclude);
        } else {
            fs.copySync(srcPath, destPath, { overwrite: true });
        }
    }
}
