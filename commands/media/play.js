

const yts = require('yt-search');
const axios = require('axios');
const config = require('../../config'); // Bhai ke bot ka config path

module.exports = {
    name: 'play',
    aliases: ['ytplay', 'song', 'sound', 'music'],
    category: 'media',
    description: 'Download and play YouTube music',
    usage: '.play <song name>',

    async execute(sock, msg, args, extra) {
        try {
            const prefix = config.prefix || '.';
            const botName = config.botName ? config.botName.toUpperCase() : 'BOT';
            const text = Array.isArray(args) ? args.join(" ") : String(args || '');

            // 1. Check if song name is provided
            if (!text) {
                let errOpt = {
                    text: `🎧 *${botName} MUSIC*\n\n┌─❖\n│ ✦ Need a song name!\n│ ✦ Example: ${prefix}play faded alan walker\n└───────────────◉\n\n🎶 Your personal music downloader`
                };
                return await sock.sendMessage(extra.from, errOpt, { quoted: msg });
            }

            // Reaction: Searching
            await sock.sendMessage(extra.from, { react: { text: "🔍", key: msg.key } });

            // 2. YouTube Search
            const { videos } = await yts(text);
            if (!videos || videos.length === 0) {
                await sock.sendMessage(extra.from, { react: { text: "😔", key: msg.key } });
                let notFoundOpt = { 
                    text: "❌ *No Results Found*\n\nI couldn't find any songs with that name.\n💡 Try different keywords or check spelling!"
                };
                return await sock.sendMessage(extra.from, notFoundOpt, { quoted: msg });
            }

            const video = videos[0];
            
            // 3. VIP Thumbnail Message (Processing)
            let thumbOpt = {
                image: { url: video.thumbnail },
                caption: `✅ *Song Found!*\n\n🎵 *${video.title}*\n⏱️ ${video.timestamp} | 👁️ ${video.views}\n\n⬇️ Downloading audio...`
            };

            let processingMsg = await sock.sendMessage(extra.from, thumbOpt, { quoted: msg });
            await sock.sendMessage(extra.from, { react: { text: "⬇️", key: msg.key } });

            // 4. API Call for Audio Download
            const apiUrl = `https://yt-dl.officialhectormanuel.workers.dev/?url=${encodeURIComponent(video.url)}`;
            const response = await axios.get(apiUrl);
            const data = response.data;

            if (!data?.status || !data.audio) {
                await sock.sendMessage(extra.from, { react: { text: "😢", key: msg.key } });
                let failOpt = { 
                    text: "🚫 *Download Failed*\n\nThe audio service is currently unavailable.\n⚡ Try again in a few minutes!", 
                    edit: processingMsg.key // Edit previous processing message
                };
                return await sock.sendMessage(extra.from, failOpt);
            }

            await sock.sendMessage(extra.from, { react: { text: "🎧", key: msg.key } });

            // 5. Download Audio as Buffer for Safe Streaming
            const audioStream = await axios.get(data.audio, { responseType: 'arraybuffer' });
            const audioBuffer = Buffer.from(audioStream.data, 'binary');

            // 6. Send Audio with VIP External Ad Reply (No Meta Flags)
            let audioOpt = {
                audio: audioBuffer,
                mimetype: "audio/mpeg", 
                fileName: `🎵 ${(data.title || video.title).substring(0, 50)}.mp3`,
                contextInfo: {
                    mentionedJid: [extra.sender],
                    externalAdReply: {
                        title: `🎧 ${botName} Music`,
                        body: video.title,
                        thumbnailUrl: video.thumbnail,
                        sourceUrl: video.url,
                        mediaType: 1,
                        renderLargerThumbnail: true // Spotify VIP Look
                    }
                }
            };

            await sock.sendMessage(extra.from, audioOpt, { quoted: msg });
            await sock.sendMessage(extra.from, { react: { text: "✅", key: msg.key } });

        } catch (error) {
            console.error('Error in play command:', error);
            await sock.sendMessage(extra.from, { react: { text: "💀", key: msg.key } });
            await extra.reply("💥 *Oops! Something broke*\n\n❌ An unexpected error occurred\n🔧 Our team has been notified\n💫 Try again in a few minutes");
        }
    }
};
