const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// yt-search package validation
let yts;
try {
    yts = require('yt-search');
} catch {
    console.log('[SYED MD] yt-search missing. Installing...');
    exec('npm install yt-search');
}

module.exports = {
  name: 'play',
  aliases: ['song', 'audio', 'ytmp3'],
  category: 'general',
  description: 'yt-dlp ke zariye local audio download karke play karein',
  usage: '.play surah rehman',

  async execute(sock, msg, args, extra) {
    const from = extra.from || msg.key.remoteJid;
    
    if (!args[0]) {
      return extra.reply('🎵 *Sahi Tariqa:* \`.play surah rehman\`\n\nBatao bhai konsa audio sunna hai?');
    }

    if (!yts) {
      return extra.reply('❌ Background dependency load ho rahi hai, 10 seconds baad dubara try karein.');
    }

    const searchQuery = args.join(' ');
    
    try {
      await extra.reply(`🔍 *Searching:* \`"${searchQuery}"\`\n⚡ yt-dlp ke zariye server par audio fetch kiya ja raha hai, thoda sabar karein...`);

      // 1. YouTube search se link nikalna
      const searchResult = await yts(searchQuery);
      const video = searchResult.videos[0];

      if (!video) {
        return extra.reply('❌ Sorry bhai, YouTube par is naam se kuch nahi mila. Name check karke dubara try karein.');
      }

      const videoUrl = video.url;
      const duration = video.timestamp;
      
      // Temporary audio file path configuration
      const outputFilename = `yt_${Date.now()}.mp3`;
      const outputPath = path.join(__dirname, '../../', outputFilename);

      // 2. Info Card Message
      let details = `🎧 *S Y E D  -  M D  P L A Y E R*\n\n`;
      details += `📌 *Title:* ${video.title}\n`;
      details += `⏱️ *Duration:* ${duration}\n\n`;
      details += `📥 _yt-dlp engine audio extract kar raha hai..._`;
      await sock.sendMessage(from, { text: details }, { quoted: msg });

      // 3. yt-dlp Local Extraction Command
      const ytdlpCommand = `yt-dlp --extract-audio --audio-format mp3 --audio-quality 0 --output "${outputPath}" "${videoUrl}"`;

      exec(ytdlpCommand, async (error, stdout, stderr) => {
        if (error) {
          console.error(`yt-dlp error: ${error.message}`);
          return extra.reply('❌ yt-dlp download fail ho gaya! Check karein ke Termux me python, ffmpeg aur yt-dlp sahi se installed hain ya nahi.');
        }

        // 4. File existence check aur WhatsApp transfer
        if (fs.existsSync(outputPath)) {
          try {
            await sock.sendMessage(from, {
              audio: { url: outputPath },
              mimetype: 'audio/mp4',
              ptt: false
            }, { quoted: msg });

            // 5. Space clean karne ke liye file delete karna (Crash-Safe)
            fs.unlinkSync(outputPath);
          } catch (sendErr) {
            console.error('Audio Sending Error:', sendErr.message);
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
          }
        } else {
          return extra.reply('❌ File extract toh hui par system me nahi mili. Dubara try karein.');
        }
      });

    } catch (err) {
      console.error('Play Command Internal Error:', err.message);
      return extra.reply('❌ *Error:* Audio process karne me koi andarooni masla aaya hai.');
    }
  }
};
                                   
