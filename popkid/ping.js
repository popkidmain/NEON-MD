const { cmd } = require('../command');
const config = require('../config');

cmd({
    pattern: "ping",
    desc: "Check bot speed",
    category: "main",
    filename: __filename
}, async (conn, m, mek, { from, sender, reply }) => {
    try {
        const start = Date.now();
        await conn.sendMessage(from, { react: { text: "⚡", key: mek.key } });
        const ms = Date.now() - start;

        const status = ms < 100 ? "🟢 Excellent" : ms < 300 ? "🟡 Good" : ms < 600 ? "🟠 Average" : "🔴 Slow";

        const text = `⚡ *Pong!*\n\n🏓 *Speed:* ${ms}ms\n📶 *Status:* ${status}`;

        const iosvCard = {
            key: { fromMe: false, participant: "0@s.whatsapp.net", remoteJid: "status@broadcast" },
            message: {
                contactMessage: {
                    displayName: "POPKID-XMD",
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:POPKID\nTEL;type=CELL;type=VOICE;waid=254111385747:+254111385747\nEND:VCARD`
                }
            }
        };

        const iosContext = {
            mentionedJid: [sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: config.NEWSLETTER_JID || '120363423997837331@newsletter',
                newsletterName: "ᴘᴏᴘᴋɪᴅ-xᴍᴅ ɴᴇᴛᴡᴏʀᴋ",
                serverMessageId: 1
            },
            externalAdReply: {
                title: "ᴘᴏᴘᴋɪᴅ ꜱʏꜱᴛᴇᴍꜱ",
                body: "ᴀɴᴀʟʏᴢɪɴɢ ʀᴇꜱᴘᴏɴꜱᴇ ᴛɪᴍᴇ...",
                mediaType: 1,
                renderLargerThumbnail: false,
                thumbnailUrl: "https://files.catbox.moe/aapw1p.png",
                sourceUrl: "https://whatsapp.com/channel/0029Vb70ySJHbFV91PNKuL3T"
            }
        };

        await conn.sendMessage(from, { text, contextInfo: iosContext }, { quoted: iosvCard });

    } catch (err) {
        console.error("PING ERROR:", err);
        reply("❌ *System Error.*");
    }
});
