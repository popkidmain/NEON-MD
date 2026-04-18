const { commands } = require('../command');
const yts = require('yt-search');
const { execFile } = require('child_process');
const fs = require('fs');

const ytdlp = (url) => new Promise((resolve, reject) => {
    execFile('yt-dlp', [
        '-x', '--audio-format', 'mp3',
        '-o', `${process.env.HOME}/%(id)s.%(ext)s`,
        '--print', 'after_move:filepath',
        '--no-playlist',
        url
    ], { timeout: 120000 }, (err, stdout, stderr) => {
        if (err) return reject(new Error(stderr || err.message));
        const filePath = stdout.trim();
        if (!filePath || !fs.existsSync(filePath)) return reject(new Error('File not found after download'));
        resolve(filePath);
    });
});

commands.push({
    pattern: 'playpop',
    alias: ['plays', 'music'],
    react: '🎵',
    desc: 'Search and download a song as MP3 from YouTube',
    type: 'user',
    function: async (conn, mek, m, { args, reply }) => {
        const chatId = mek.key.remoteJid;
        const query = args.join(' ').trim();

        if (!query)
            return reply('🎵 *Which song do you want to play?*\nUsage: .play <song name>');

        try {
            await conn.sendMessage(chatId, { text: '🔍 *Searching...*' }, { quoted: mek });

            const { videos } = await yts(query);
            if (!videos?.length)
                return reply('❌ *No results found!*');

            const video = videos[0];

            await conn.sendMessage(chatId, {
                text: `✅ *Found:* ${video.title}\n⏱️ ${video.timestamp}\n👤 ${video.author.name}\n\n⏳ *Downloading...*`
            }, { quoted: mek });

            const filePath = await ytdlp(video.url);

            await conn.sendMessage(chatId, {
                audio: { url: filePath },
                mimetype: 'audio/mpeg',
                fileName: `${video.title}.mp3`
            }, { quoted: mek });

            fs.unlinkSync(filePath);

        } catch (err) {
            console.error('Play error:', err.message);
            await reply(`❌ *Failed:* ${err.message}`);
        }
    }
});
