const axios = require('axios');

module.exports = {
  name: 'play',
  aliases: ['song', 'music'],
  category: 'media',
  description: 'Search and play audio from YouTube',
  usage: '.play [song name]',

  async execute(sock, msg, args, extra) {
    const from = extra.from || msg.key.remoteJid;
    const songQuery = args.join(' ');

    if (!songQuery) {
        return sock.sendMessage(from, {
            text: "╭━━━〔 ⚠️ *MISSING INPUT* 〕━━━👉\n┃\n┃ ⚠️ *Error:* Song name missing!\n┃ 📝 *Format:* `.play [Song Name]`\n┃\n┃ 💡 *Example:* `.play tum hi ho`\n┃\n╰━━━━━━━━━━━━━━━━━━━━━━━👉"
        }, { quoted: msg });
    }

    // Processing message with SYED MD branding
    const initialMsg = await sock.sendMessage(from, { 
        text: `⚡ 💠 *S Y E D  M D  M U S I C* 💠 ⚡\n\n🔍 *Searching:* \`${songQuery}\`\n⏳ Please wait, fetching audio data...` 
    }, { quoted: msg });

    try {
      // YouTube search + download API 
      const apiUrl = `https://api.dreaded.site/api/ytdl/play?query=${encodeURIComponent(songQuery)}`;
      const response = await axios.get(apiUrl);
      const resData = response.data;

      if (!resData || resData.status !== 200 || !resData.result) {
          return sock.sendMessage(from, { text: "❌ *Error:* Song not found or API is busy. Try another name!" }, { quoted: msg });
      }

      const song = resData.result;
      
      // V.I.P Card Output Design with SYED MD Branding
      let musicCard = `⚡ 📲  *S Y E D   M D   M U S I C*  📲 ⚡\n`;
      musicCard += `╔══════════════════════╗\n`;
      musicCard += `  🎵 *TITLE:* \`${song.title || 'Unknown'}\`\n`;
      musicCard += `  👤 *CHANNEL:* \`${song.channel || 'N/A'}\`\n`;
      musicCard += `  ⏱️ *DURATION:* \`${song.duration || 'N/A'}\`\n`;
      musicCard += `  🔗 *URL:* ${song.url || 'N/A'}\n`;
      musicCard += `╚══════════════════════╝\n\n`;
      musicCard += `🎶 *Sending Audio... Stay tuned!*`;

      // Update text card
      await sock.sendMessage(from, { text: musicCard, edit: initialMsg.key });

      // Fetch and send audio buffer
      const audioResponse = await axios.get(song.downloadUrl, { responseType: 'arraybuffer' });
      const audioBuffer = Buffer.from(audioResponse.data);

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
      console.error('Play Command Error:', err.message);
      return sock.sendMessage(from, { text: "❌ *Server Error:* Unable to stream this song right now." }, { quoted: msg });
    }
  }
};
    
