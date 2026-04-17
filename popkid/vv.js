const { cmd } = require('../command');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

cmd({
    pattern: "vv",
    alias: ["viewonce", "reveal"],
    desc: "Reveal view-once image or video",
    category: "tools",
    react: "👁️",
    filename: __filename
},
async (conn, mek, m, { from, sender, reply }) => {
    try {
        const quoted =
            mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        if (!quoted) {
            return reply("❌ Reply to a *view-once image or video*.");
        }

        // ✅ FIX 1: Correctly detect view-once wrapper
        const viewOnceWrapper =
            quoted.viewOnceMessageV2 ||
            quoted.viewOnceMessage ||
            null;

        // ✅ FIX 2: Pull the media message from the wrapper (or fallback to direct)
        const mediaMessage =
            viewOnceWrapper?.message?.imageMessage ||
            viewOnceWrapper?.message?.videoMessage ||
            quoted.imageMessage ||
            quoted.videoMessage ||
            null;

        if (!mediaMessage) {
            return reply("❌ No image or video found in the replied message.");
        }

        // ✅ FIX 3: Determine type by mimetype only (mediaMessage IS the image/video object)
        const isImage = mediaMessage.mimetype?.startsWith("image");
        const isVideo = mediaMessage.mimetype?.startsWith("video");

        if (!isImage && !isVideo) {
            return reply("❌ Unsupported media type: " + (mediaMessage.mimetype || "unknown"));
        }

        // ✅ FIX 4: Check viewOnce on the WRAPPER, not the media message
        if (!viewOnceWrapper) {
            return reply("❌ This is not a view-once message.");
        }

        // Random reaction emoji
        const reactionEmojis = ['🔥','⚡','🚀','💨','🎯','🎉','🌟','💥','👁️'];
        const reactEmoji = reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)];

        await conn.sendMessage(from, {
            react: { text: reactEmoji, key: mek.key }
        });

        // ✅ FIX 5: Download using correct type string
        const mediaType = isImage ? "image" : "video";
        const stream = await downloadContentFromMessage(mediaMessage, mediaType);

        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        // Send revealed media
        await conn.sendMessage(from, {
            [mediaType]: buffer,
            caption: mediaMessage.caption || '👁️ *View-Once Revealed*',
            contextInfo: {
                mentionedJid: [sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: "120363289379419860@newsletter",
                    newsletterName: "Popkid XTR",
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

    } catch (err) {
        console.error("VV Command Error:", err);
        reply(`❌ Failed to reveal view-once media.\n\`${err.message}\``);
    }
});
