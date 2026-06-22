/*INSTAGRAM DOWNLOADER*/

const axios = require('axios');
const config = require('../../config');

module.exports = {
    name: 'ig',
    aliases: ['insta', 'igdl'],
    category: 'media',
    description: 'Download Instagram videos, reels, or images',
    usage: '.ig <instagram_url>',
    ownerOnly: false,

    async execute(sock, msg, args, extra) {
        try {
            const prefix = config.prefix || '.';
            const url = args[0];

            // 1. URL Validation
            if (!url || !url.includes('instagram.com')) {
                return await sock.sendMessage(extra.from, { 
                    text: `❌ *Valid Instagram Link Required!*\n\n📌 *Example:* ${prefix}ig https://www.instagram.com/reel/DZcgeM4NXp8/` 
                }, { quoted: msg });
            }

            // 2. Initial Reaction
            await sock.sendMessage(extra.from, { react: { text: "⏳", key: msg.key } });

            // 3. API Call
            const apiUrl = `https://api.nexray.eu.cc/downloader/instagram?url=${encodeURIComponent(url)}`;
            const response = await axios.get(apiUrl);

            // 4. API Error Handling
            if (!response.data || !response.data.status || !response.data.result || response.data.result.length === 0) {
                await sock.sendMessage(extra.from, { react: { text: "❌", key: msg.key } });
                return extra.reply("❌ Media not found or API is currently down! Please verify the link.");
            }

            const mediaList = response.data.result;

            // 5. Constructing Caption (Sirf pehli file ke sath jayega)
            let captionText = `╭━━『 *QADEER AI - INSTAGRAM* 』━━╮\n`;
            captionText += `╰━━━━━━━━━━━━━━━━━━━━━╯\n\n`;
            captionText += `> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ${config.botName || 'QADEER AI'}*`;

            // 6. Loop through all media items (agar multiple videos/images hui ek post mein)
            for (let i = 0; i < mediaList.length; i++) {
                const media = mediaList[i];
                
                // Simple media object, removed all meta/ai flags
                let mediaOpt = {};

                // Caption sirf pehli photo/video pe lagana hai
                if (i === 0) {
                    mediaOpt.caption = captionText;
                }

                // Check type and assign URL
                if (media.type === 'video') {
                    mediaOpt.video = { url: media.url };
                } else {
                    mediaOpt.image = { url: media.url };
                }

                // Send the media normally
                await sock.sendMessage(extra.from, mediaOpt, { quoted: msg });
            }

            // 7. Success Reaction
            await sock.sendMessage(extra.from, { react: { text: "✅", key: msg.key } });

        } catch (error) {
            console.error("IG Downloader command error:", error);
            await sock.sendMessage(extra.from, { react: { text: "❌", key: msg.key } });
            
            let errMsg = error.response ? "API is currently unresponsive. Try again later." : error.message;
            extra.reply(`❌ *Failed to download Instagram media!*\n\n⚠️ *Reason:* ${errMsg}`);
        }
    }
};
