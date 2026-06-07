const axios = require('axios');
const fs = require('fs');
const path = require('path');
const config = require('../../config');

module.exports = {
  name: 'ytdl',
  aliases: ['ytdl1', 'video', 'ytmp4'],
  category: 'media',
  description: 'Download YouTube video directly to server and send',
  usage: '.ytdl <url>',

  async execute(sock, msg, args, extra) {
    const text = Array.isArray(args) ? args.join(' ') : String(args || '');
    const botName = config.botName?.toUpperCase() || 'BOT';

    if (!text || !text.includes('youtu')) {
      return extra.reply(
        '❌ *Invalid Input*\nPlease provide a valid YouTube link.\n\nExample:\n.ytdl https://youtu.be/xxxx'
      );
    }

    // 🔹 Progress Message Init
    const progressMsg = await sock.sendMessage(
      extra.from,
      { text: '⏳ *Initializing download...*' },
      { quoted: msg }
    );

    let tmpFilePath = null;

    try {
      // Reaction 1: Status Update
      await sock.sendMessage(extra.from, { react: { text: '⏳', key: progressMsg.key } });

      await sock.sendMessage(extra.from, {
        text: '🔍 *Fetching video download link from API...*',
        edit: progressMsg.key
      });

      const apiUrl = `https://www.movanest.xyz/v2/ytdown?url=${encodeURIComponent(text)}&quality=best`;
      const { data } = await axios.get(apiUrl);

      if (!data?.status || !data?.download?.link) {
        throw new Error('API failed to provide a valid download link.');
      }

      // Edit: Downloading to Server Buffer
      await sock.sendMessage(extra.from, {
        text: `📥 *Video Found!*\n\n🎬 *Title:* ${data.title}\n📺 *Quality:* ${data.download.label}\n\n⚡ *Downloading file to server (Converter processing)...*`,
        edit: progressMsg.key
      });

      // 📥 Downloader Core: Stream binary data directly to prevent corrupt type error
      const videoUrl = data.download.link;
      const response = await axios({
        method: 'get',
        url: videoUrl,
        responseType: 'arraybuffer', // Converts file input streams properly
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      // Temporary file create kar rahe hain server par send karne ke liye
      const fileName = `yt_${Date.now()}.mp4`;
      tmpFilePath = path.join(__dirname, fileName);
      fs.writeFileSync(tmpFilePath, response.data);

      // Reaction 2: Uploading
      await sock.sendMessage(extra.from, { react: { text: '📥', key: progressMsg.key } });

      await sock.sendMessage(extra.from, {
        text: `🚀 *Uploading to WhatsApp...*\n\n🎬 *Title:* ${data.title}`,
        edit: progressMsg.key
      });

      // 🎥 Sending local video file buffer stream
      await sock.sendMessage(
        extra.from,
        {
          video: fs.readFileSync(tmpFilePath),
          mimetype: 'video/mp4',
          caption: `🎬 *${data.title}*\n📺 *Quality:* ${data.download.label}\n\n⚡ *Powered by ${botName}*`
        },
        { quoted: msg }
      );

      // Reaction 3: Complete
      await sock.sendMessage(extra.from, { react: { text: '✅', key: progressMsg.key } });

      await sock.sendMessage(extra.from, {
        text: `✅ *Download Completed!*\n\nEnjoy your video 🎉`,
        edit: progressMsg.key
      });

    } catch (err) {
      console.error('[ytdl error]', err);
      
      await sock.sendMessage(extra.from, { react: { text: '❌', key: progressMsg.key } });
      await sock.sendMessage(extra.from, {
        text: `❌ *Error Occurred!*\n\nUnable to convert or send this video. The link might be expired or protected. Try another video link.`,
        edit: progressMsg.key
      });
    } finally {
      // 🧼 Cleanup: Server space clean karne ke liye temp file delete karna zaroori hai
      if (tmpFilePath && fs.existsSync(tmpFilePath)) {
        try {
          fs.unlinkSync(tmpFilePath);
        } catch (e) {
          console.error('Temp file cleanup failed:', e);
        }
      }
    }
  }
};
