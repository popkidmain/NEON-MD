const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { cmd } = require("../command");

cmd({
  pattern: "vv",
  alias: ["viewonce", "viewmedia", "vo"],
  react: '👁',
  desc: "Re-send a view once image or video",
  category: "utility",
  use: ".vv [reply to view once message]",
  filename: __filename
}, async (conn, mek, m, { from, reply }) => {
  try {
    const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedImage = quoted?.imageMessage;
    const quotedVideo = quoted?.videoMessage;

    if (quotedImage && quotedImage.viewOnce) {
      const stream = await downloadContentFromMessage(quotedImage, 'image');
      let buffer = Buffer.from([]);
      for await (const chunk of stream)
        buffer = Buffer.concat([buffer, chunk]);

      await conn.sendMessage(from, {
        image: buffer,
        fileName: 'media.jpg',
        caption: quotedImage.caption || '👁 *View Once Image*\n\n> *popkid*'
      }, { quoted: mek });

    } else if (quotedVideo && quotedVideo.viewOnce) {
      const stream = await downloadContentFromMessage(quotedVideo, 'video');
      let buffer = Buffer.from([]);
      for await (const chunk of stream)
        buffer = Buffer.concat([buffer, chunk]);

      await conn.sendMessage(from, {
        video: buffer,
        fileName: 'media.mp4',
        mimetype: 'video/mp4',
        caption: quotedVideo.caption || '👁 *View Once Video*\n\n> *popkid*'
      }, { quoted: mek });

    } else {
      await reply("❌ Please reply to a view once image or video.");
    }

  } catch (error) {
    console.error("vv error:", error);
    await reply("❌ Failed to retrieve view once media. Please try again.");
  }
});
