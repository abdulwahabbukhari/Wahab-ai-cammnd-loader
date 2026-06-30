const fetch = require('node-fetch');

module.exports = {
  name: 'xv',
  category: 'search',
  description: 'Download video from Xvideos',
  usage: '.xv <url>',

  async execute(sock, msg, args, extra) {
    if (!args[0]) return extra.reply("❌ *Please provide a valid URL!*");
    
    try {
      await extra.reply("⏳ *Fetching and processing, please wait...*");
      
      // API call
      const response = await fetch(`https://arslan-apis-v2.vercel.app/download/xvideosDown?url=${encodeURIComponent(args[0])}`);
      const json = await response.json();
      
      // Debug: Agar API JSON de rahi hai, toh uska video link nikalna hoga
      // JSON structure ke hisab se field name (jaise .result.url) change ho sakta hai
      const videoUrl = json.result || json.url || json.link || json.video; 
      
      if (!videoUrl) return extra.reply("❌ *Video link nahi mil saka, API response invalid hai.*");

      // Video send karna
      await sock.sendMessage(extra.from, { 
        video: { url: videoUrl }, 
        caption: "✅ *Downloaded by 𝚂𝚢𝚎𝚍 𝙼𝙳*",
        mimetype: 'video/mp4'
      }, { quoted: msg });
      
    } catch (error) {
      extra.reply("❌ *Error:* " + error.message);
    }
  }
};
       
