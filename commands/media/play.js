const axios = require('axios');

module.exports = {
  name: 'play',
  aliases: ['song', 'music'],
  category: 'general',
  description: 'Search and play audio from YT via Secondary CDN',
  usage: '.play [song name]',

  async execute(sock, msg, args, extra) {
    const from = extra.from || msg.key.remoteJid;
    const songQuery = args.join(' ');

    if (!songQuery) {
        return sock.sendMessage(from, {
            text: "╭━━━〔 ⚠️ *MISSING INPUT* 〕━━━👉\n┃\n┃ ⚠️ *Error:* Song name missing!\n┃ 📝 *Format:* `.play [Song Name]`\n┃\n┃ 💡 *Example:* `.play tum hi ho`\n┃\n╰━━━━━━━━━━━━━━━━━━━━━━━👉"
        }, { quoted: msg });
    }

    // Processing Message
    const initialMsg = await sock.sendMessage(from, { 
        text: `⚡ 💠 *S Y E D  M D  M U S I C* 💠 ⚡\n\n🔍 *Searching:* \`${songQuery}\`\n⏳ Please wait, fetching from backup server...` 
    }, { quoted: msg });

    try {
      // Backup High-Speed API Network
      const searchUrl = `https://api.sandipbaruwal.com.np/ytdl?url=${encodeURIComponent(songQuery)}`;
      const response = await axios.get(searchUrl);
      
      if (!response.data || !response.data.video_id) {
          // If query search fails, try secondary endpoint
          return sock.sendMessage(from, { text: "❌ *Error:* Song not found or search server timed out. Try another keyword!" }, { quoted: msg });
      }

      const songData = response.data;
      const audioLink = songData.audio_url || songData.download_url;

      if (!audioLink) {
          return sock.sendMessage(from, { text: "❌ *Error:* Could not extract downloadable link for this song." }, { quoted: msg });
      }

      // V.I.P UI Card
      let musicCard = `⚡ 📲  *S Y E D   M D   M U S I C*  📲 ⚡\n`;
      musicCard += `╔══════════════════════╗\n`;
      musicCard += `  🎵 *TITLE:* \`${songData.title || 'Unknown'}\`\n`;
      musicCard += `  ⏱️ *DURATION:* \`${songData.duration || 'N/A'}\`\n`;
      musicCard += `  🔗 *ID:* \`${songData.video_id}\`\n`;
      musicCard += `╚══════════════════════╝\n\n`;
      musicCard += `🎶 *Sending Audio Track... Enjoy!*`;

      // Update Text Card
      await sock.sendMessage(from, { text: musicCard, edit: initialMsg.key });

      // Fetch Audio Buffer from Backup CDN
      const audioResponse = await axios.get(audioLink, { responseType: 'arraybuffer' });
      const audioBuffer = Buffer.from(audioResponse.data);

      // Final Audio message without PTT
      await sock.sendMessage(
        from,
        {
          audio: audioBuffer,
          mimetype: 'audio/mpeg',
          ptt: false
        },
        { quoted: msg }
      );

    } catch (err) {
      console.error('Play Backup Command Error:', err.message);
      return sock.sendMessage(from, { text: "❌ *Server Error:* Both primary and secondary music engines are overloaded. Try again in a minute!" }, { quoted: msg });
    }
  }
};
    
