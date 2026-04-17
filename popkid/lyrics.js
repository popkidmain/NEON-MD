const axios = require('axios');
const { cmd } = require("../command");

cmd({
  pattern: "lyrics",
  alias: ["lyric", "songlyrics", "lyr"],
  react: '🎵',
  desc: "Get lyrics of a song",
  category: "music",
  use: ".lyrics <song name>",
  filename: __filename
}, async (conn, mek, m, { from, reply, text: q }) => {
  try {

    if (!q) return reply("🎵 Usage: .lyrics <song name>\nExample: .lyrics Blinding Lights");

    await reply("⏳ Searching lyrics...");

    const res = await axios.get(
      `https://discardapi.dpdns.org/api/music/lyrics?apikey=qasim&song=${encodeURIComponent(q)}`,
      { timeout: 15000 }
    );

    const messageData = res.data?.result?.message;
    if (!messageData?.lyrics) return reply(`❌ No lyrics found for "${q}".`);

    const { artist, lyrics, image, title, url } = messageData;

    const lyricsOutput = lyrics.length > 4096 ? lyrics.slice(0, 4093) + '...' : lyrics;

    const caption =
      `🎵 *${title}*\n` +
      `👤 *Artist:* ${artist}\n` +
      `🔗 *URL:* ${url}\n\n` +
      `📝 *Lyrics:*\n${lyricsOutput}\n\n` +
      `> *popkid*`;

    if (image) {
      await conn.sendMessage(from, { image: { url: image }, caption }, { quoted: mek });
    } else {
      await conn.sendMessage(from, { text: caption }, { quoted: mek });
    }

  } catch (error) {
    console.error("lyrics error:", error);
    await reply(`❌ Error: ${error.message || error}`);
  }
});
