// plugins/update.js
const { cmd } = require("../command"); // keeps your style consistent
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");

cmd({
  pattern: "update",
  alias: ["updatenow", "sync"],
  use: ".update",
  desc: "Update the bot to the latest version (owner only).",
  category: "owner",
  react: "🆕",
  filename: __filename
},
async (conn, mek, m, { from, quoted, q, react, reply, isSuperUser, isOwner, setCommitHash, getCommitHash }) => {
  try {
    // owner check
    if (!isSuperUser && !isOwner) {
      try { await react("❌"); } catch (e) {}
      return reply("❌ Owner Only Command!");
    }

    // repo settings (change if you want different repo/branch)
    const repoOwner = "popkidmain";
    const repoName = "NEON-MD";
    const branch = "main";
    const apiCommitUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/commits/${branch}`;
    const zipUrl = `https://github.com/${repoOwner}/${repoName}/archive/${branch}.zip`;

    await conn.sendMessage(from, { text: "🔍 Checking for new updates..." }, { quoted: mek });

    // fetch latest commit info
    const { data: commitData } = await axios.get(apiCommitUrl, { headers: { "User-Agent": "node.js" } });
    const latestCommitHash = commitData.sha;

    // fallback commit storage if user didn't supply get/set
    const commitFile = path.join(process.cwd(), ".last_update_commit");

    const fallbackGet = async () => {
      try {
        if (fs.existsSync(commitFile)) return fs.readFileSync(commitFile, "utf8").trim();
      } catch (e) { /* ignore */ }
      return null;
    };
    const fallbackSet = async (h) => {
      try { fs.writeFileSync(commitFile, String(h), "utf8"); } catch (e) { console.error("Could not save commit hash:", e); }
    };

    const readCurrent = (typeof getCommitHash === "function") ? await getCommitHash() : await fallbackGet();

    if (readCurrent && readCurrent === latestCommitHash) {
      return conn.sendMessage(from, { text: "✅ Bot is already on the latest version!" }, { quoted: mek });
    }

    // ----- OVERRIDE DISPLAY -----
    const authorName = "popkid";          // always show popkid
    const authorEmail = "popkid@gmail.com"; // masked email
    const commitDate = new Date(commitData.commit.author.date).toLocaleString();
    const commitMessage = commitData.commit.message || "";

    await conn.sendMessage(from, {
      text: `🧨 Updating bot to latest commit\n\n*Commit Details:*\n👤 ${authorName} (${authorEmail})\n📅 ${commitDate}\n💬 ${commitMessage}`
    }, { quoted: mek });

    // download ZIP to temp
    const zipPath = path.join(__dirname, "..", `${repoName}-${branch}.zip`);
    const tmpExtract = path.join(__dirname, "..", "latest_update_tmp");

    const zipRes = await axios.get(zipUrl, { responseType: "arraybuffer", headers: { "User-Agent": "node.js" } });
    fs.writeFileSync(zipPath, zipRes.data);

    // extract
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(tmpExtract, true);

    // source folder inside extracted zip (github repo-branch)
    const sourcePath = path.join(tmpExtract, `${repoName}-${branch}`);
    const destinationPath = path.join(process.cwd()); // root of your bot repo

    // copy while skipping sensitive/local files
    copyFolderSync(sourcePath, destinationPath, [
      "config.js",
      "app.json",
      ".env",
      "session.data.json",
      "session.json",
      "session",
      "storage.json",
      "node_modules", // don't overwrite node_modules
    ]);

    // persist commit hash via provided setter or fallback
    if (typeof setCommitHash === "function") {
      try { await setCommitHash(latestCommitHash); } catch (e) { console.error("setCommitHash error:", e); }
    } else {
      await fallbackSet(latestCommitHash);
    }

    // cleanup
    try { fs.unlinkSync(zipPath); } catch (e) {}
    try { fs.rmSync(tmpExtract, { recursive: true, force: true }); } catch (e) {}

    await conn.sendMessage(from, { text: "✅ Update complete! Bot is restarting..." }, { quoted: mek });

    // small delay to let message deliver
    setTimeout(() => {
      try { process.exit(0); } catch (e) { /* ignore */ }
    }, 1500);

  } catch (error) {
    console.error("Update error:", error);
    try {
      await conn.sendMessage(from, { text: "❌ Update Failed. Please redeploy manually. Error: " + (error && error.message ? error.message : String(error)) }, { quoted: mek });
    } catch (e) { /* ignore */ }
  }
});

// copy helper: skips listed filenames, preserves directory structure
function copyFolderSync(source, target, skipList = []) {
  if (!fs.existsSync(source)) return;
  if (!fs.existsSync(target)) fs.mkdirSync(target, { recursive: true });

  for (const item of fs.readdirSync(source)) {
    if (skipList.includes(item)) {
      console.log(`Skipping ${item} (preserve local).`);
      continue;
    }

    const src = path.join(source, item);
    const dest = path.join(target, item);
    const stat = fs.lstatSync(src);

    if (stat.isDirectory()) {
      copyFolderSync(src, dest, skipList);
    } else {
      // ensure dest dir exists
      const destDir = path.dirname(dest);
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(src, dest);
    }
  }
}
