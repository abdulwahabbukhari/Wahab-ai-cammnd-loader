const yts = require('yt-search');
const axios = require('axios');
const config = require('../../config');

module.exports = {
    name: 'video',
  aliases: ['ytmp4', 'ytvideo'],
    category: 'media',
    description: 'Download YouTube video with smart quality fallback',
    usage: '.video <video name>',

    async execute(sock, msg, args, extra) {
        try {
            const prefix = config.prefix || '.';
            const botName = config.botName ? config.botName.toUpperCase() : 'BOT';
            const text = Array.isArray(args) ? args.join(" ") : String(args || '');

            if (!text) {
                let errOpt = {
                    text: `🎬 *${botName} VIDEO DOWNLOADER*\n\n┌─❖\n│ ✦ Need a video name!\n│ ✦ Example: ${prefix}video 99 name of ALLAH\n└───────────────◉`
                };
                return await sock.sendMessage(extra.from, errOpt, { quoted: msg });
            }

            // Searching Reaction
            await sock.sendMessage(extra.from, { react: { text: "🔍", key: msg.key } });

            const { videos } = await yts(text);
            if (!videos || videos.length === 0) {
                await sock.sendMessage(extra.from, { react: { text: "😔", key: msg.key } });
                let notFoundOpt = { 
                    text: "❌ *No Results Found*\n\nVideo nahi mili. Koi aur naam try karein!"
                };
                return await sock.sendMessage(extra.from, notFoundOpt, { quoted: msg });
            }

            const video = videos[0];
            
            // Thumbnail Message
            let thumbOpt = {
                image: { url: video.thumbnail },
                caption: `✅ *Video Found!*\n\n🎬 *${video.title}*\n⏱️ ${video.timestamp} | 👁️ ${video.views}\n\n⬇️ Fetching best quality...`
            };

            let processingMsg = await sock.sendMessage(extra.from, thumbOpt, { quoted: msg });
            await sock.sendMessage(extra.from, { react: { text: "⬇️", key: msg.key } });

            // Hector Manuel API Call
            const apiUrl = `https://yt-dl.officialhectormanuel.workers.dev/?url=${encodeURIComponent(video.url)}`;
            const response = await axios.get(apiUrl);
            const data = response.data;

            if (!data?.status || !data.videos) {
                await sock.sendMessage(extra.from, { react: { text: "😢", key: msg.key } });
                let failOpt = { 
                    text: "🚫 *Download Failed*\n\nAPI service currently response nahi de rahi. Thori der baad try karein!", 
                    edit: processingMsg.key
                };
                return await sock.sendMessage(extra.from, failOpt);
            }

            await sock.sendMessage(extra.from, { react: { text: "🔄", key: msg.key } });

            // 🌟 Smart Quality Fallback Logic (720p -> 480p -> 360p) - No Size Limit
            const qualitiesToTry = ['720', '480', '360'];
            let videoBuffer = null;
            let finalQuality = '';

            for (const q of qualitiesToTry) {
                if (data.videos[q]) {
                    try {
                        // Download attempt with Buffer
                        const streamRes = await axios.get(data.videos[q], { 
                            responseType: 'arraybuffer',
                            timeout: 120000 // 2 minutes timeout for large files
                        });
                        
                        videoBuffer = Buffer.from(streamRes.data, 'binary');
                        finalQuality = q;
                        break; // Success! File downloaded, loop break kar do
                    } catch (err) {
                        console.log(`[${botName}] Failed to fetch ${q}p:`, err.message);
                        // Loop will continue to next quality (e.g., if 720p link is broken, goes to 480p)
                    }
                }
            }

            // Agar teeno links dead hon (jo ke rare hai)
            if (!videoBuffer) {
                await sock.sendMessage(extra.from, { react: { text: "❌", key: msg.key } });
                let errorOpt = { 
                    text: "🚫 *Download Failed*\n\nVideo download karne mein error aa raha hai. Link masla kar raha hai.", 
                    edit: processingMsg.key
                };
                return await sock.sendMessage(extra.from, errorOpt);
            }

            await sock.sendMessage(extra.from, { react: { text: "🎬", key: msg.key } });

            let videoOpt = {
                video: videoBuffer,
                mimetype: "video/mp4", 
                fileName: `🎬 ${(data.title || video.title).substring(0, 50)}.mp4`,
                caption: `🎬 *Title:* ${data.title || video.title}\n📺 *Quality:* ${finalQuality}p\n\n> *© ${botName}*`,
                contextInfo: {
                    mentionedJid: [extra.sender]
                }
            };

            await sock.sendMessage(extra.from, videoOpt, { quoted: msg });
            await sock.sendMessage(extra.from, { react: { text: "✅", key: msg.key } });

        } catch (error) {
            console.error('Error in video command:', error);
            await sock.sendMessage(extra.from, { react: { text: "💀", key: msg.key } });
            await extra.reply("💥 *Oops! Something broke*\n\n❌ Server main error aa gaya. Dobara try karein!");
        }
    }
};
