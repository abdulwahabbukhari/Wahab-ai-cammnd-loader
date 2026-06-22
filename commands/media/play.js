const axios = require('axios');

module.exports = {
  name: 'play',
  aliases: ['song', 'audio', 'ytmp3'],
  category: 'general',
  description: 'YouTube se audio play karein (Multi-API Backup Version)',
  usage: '.play surah rehman',

  async execute(sock, msg, args, extra) {
    const from = extra.from || msg.key.remoteJid;
    
    if (!args[0]) {
      return extra.reply('🎵 *Sahi Tariqa:* \`.play surah rehman\`\n\nBatao bhai konsa audio sunna hai?');
    }

    const searchQuery = args.join(' ');
    
    try {
      await extra.reply(`🔍 *Searching:* \`"${searchQuery}"\`\n⚡ YouTube se audio fetch kiya ja raha hai, thoda sabar karein...`);

      let audioUrl = null;
      let title = 'Audio File';
      let duration = 'Unknown';
      let success = false;

      // ==================== ENGINE 1 (FIRST TRY) ====================
      try {
        const res1 = await axios.get(`https://api.nexray.eu.cc/download/ytmp3?search=${encodeURIComponent(searchQuery)}`);
        if (res1.data && res1.data.status && res1.data.result) {
          const data = res1.data.result;
          audioUrl = data.downloadUrl || data.url;
          title = data.title || title;
          duration = data.duration || duration;
          if (audioUrl) success = true;
        }
      } catch (e) {
        console.log("[PLAY ENGINE 1] Failed, switching to backup...");
      }

      // ==================== ENGINE 2 (BACKUP TRY) ====================
      if (!success) {
        try {
          const res2 = await axios.get(`https://api.giftedtech.my.id/api/download/dlmp3?url=${encodeURIComponent(searchQuery)}`);
          if (res2.data && res2.data.success && res2.data.result) {
            const data = res2.data.result;
            audioUrl = data.download_url || data.url;
            title = data.title || title;
            duration = data.duration || duration;
            if (audioUrl) success = true;
          }
        } catch (e) {
          console.log("[PLAY ENGINE 2] Failed, switching to secondary backup...");
        }
      }

      // ==================== ENGINE 3 (FINAL BACKUP) ====================
      if (!success) {
        try {
          const res3 = await axios.get(`https://api.botcahx.eu.org/api/download/ytmp3?url=${encodeURIComponent(searchQuery)}&apikey=QA9LwXwR`);
          if (res3.data && res3.data.status && res3.data.result) {
            const data = res3.data.result;
            audioUrl = data.url || data.mp3;
            title = data.title || title;
            duration = data.duration || duration;
            if (audioUrl) success = true;
          }
        } catch (e) {
          console.log("[PLAY ENGINE 3] All engines failed.");
        }
      }

      // ==================== SENDING LOGIC ====================
      if (success && audioUrl) {
        // Info Card
        let details = `🎧 *S Y E D  -  M D  P L A Y E R*\n\n`;
        details += `📌 *Title:* ${title}\n`;
        details += `⏱️ *Duration:* ${duration}\n\n`;
        details += `🚀 *Sending Audio...*`;
        await sock.sendMessage(from, { text: details }, { quoted: msg });

        // Final Audio Message Send
        return await sock.sendMessage(from, {
          audio: { url: audioUrl },
          mimetype: 'audio/mp4',
          ptt: false
        }, { quoted: msg });

      } else {
        return extra.reply('❌ Sorry bhai! Saare high-speed download servers busy hain. Kuch der baad ya koi aur naam likh kar try karein.');
      }

    } catch (err) {
      console.error('Play Command Fatal Error:', err.message);
      return extra.reply('❌ *Error:* Request process nahi ho saki. Internet ya cloud server me temporary issue hai.');
    }
  }
};
          
