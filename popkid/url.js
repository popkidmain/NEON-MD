const axios = require("axios");
const FormData = require('form-data');
const fs = require('fs');
const os = require('os');
const path = require("path");
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { cmd } = require("../command");

cmd({
  pattern: "tourl",
  alias: ["imgtourl", "imgurl", "url", "geturl", "upload"],
  react: '🖇',
  desc: "Convert media to URL",
  category: "utility",
  use: ".tourl [reply to media]",
  filename: __filename
}, async (conn, mek, m, { reply }) => {
  try {
    const ctxInfo = mek.message?.extendedTextMessage?.contextInfo;
    const quotedMsg = ctxInfo?.quotedMessage;

    if (!quotedMsg) {
      return reply("❌ Please reply to an image, video, audio, or document.");
    }

    const mtype = Object.keys(quotedMsg)[0];

    const typeMap = {
      imageMessage:    { mediaType: 'image',    ext: '.jpg', label: 'Image'    },
      videoMessage:    { mediaType: 'video',    ext: '.mp4', label: 'Video'    },
      audioMessage:    { mediaType: 'audio',    ext: '.mp3', label: 'Audio'    },
      documentMessage: { mediaType: 'document', ext: '.bin', label: 'Document' },
      stickerMessage:  { mediaType: 'sticker',  ext: '.webp', label: 'Sticker' },
    };

    const matched = typeMap[mtype];
    if (!matched) return reply("❌ Unsupported media type.");

    await reply("⏳ Downloading media...");

    // Download via Baileys
    const stream = await downloadContentFromMessage(quotedMsg[mtype], matched.mediaType);
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    const mediaBuffer = Buffer.concat(chunks);

    const tempFilePath = path.join(os.tmpdir(), `upload_${Date.now()}${matched.ext}`);
    fs.writeFileSync(tempFilePath, mediaBuffer);

    await reply("⏳ Uploading...");

    let mediaUrl = null;

    // ── Try 0x0.st first ──────────────────────────────────
    try {
      const form1 = new FormData();
      form1.append('file', fs.createReadStream(tempFilePath), `file${matched.ext}`);

      const res1 = await axios.post("https://0x0.st", form1, {
        headers: form1.getHeaders(),
        timeout: 60000
      });

      if (res1.data && res1.data.trim().startsWith('https://')) {
        mediaUrl = res1.data.trim();
      }
    } catch (e) {
      console.log("0x0.st failed, trying uguu.se...");
    }

    // ── Fallback: uguu.se ─────────────────────────────────
    if (!mediaUrl) {
      try {
        const form2 = new FormData();
        form2.append('files[]', fs.createReadStream(tempFilePath), `file${matched.ext}`);

        const res2 = await axios.post("https://uguu.se/upload.php", form2, {
          headers: form2.getHeaders(),
          timeout: 60000
        });

        const files = res2.data?.files;
        if (files && files[0]?.url) {
          mediaUrl = files[0].url;
        }
      } catch (e) {
        console.log("uguu.se also failed:", e.message);
      }
    }

    // Cleanup
    fs.unlinkSync(tempFilePath);

    if (!mediaUrl) {
      return reply("❌ All upload services failed. Please try again later.");
    }

    await reply(
      `*${matched.label} Uploaded Successfully ✅*\n\n` +
      `*Size:* ${formatBytes(mediaBuffer.length)}\n` +
      `*URL:* ${mediaUrl}\n\n` +
      `> *popkid*`
    );

  } catch (error) {
    console.error("tourl error:", error);
    await reply(`❌ Error: ${error.message || error}`);
  }
});

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
