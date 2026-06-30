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
      
      const response = await fetch(`https://arslan-apis-v2.vercel.app/download/xvideosDown?url=${encodeURIComponent(args[0])}`);
      const json = await response.json();
      
      // Yahan hum log check karenge ki data sahi hai ya nahi
      let videoUrl = json.result || json.url || json.link || json.video;

      // Agar videoUrl abhi bhi object hai, toh hume uski string property nikalni hogi
      if (typeof videoUrl === 'object') {
          // Aksar API response mein link 'url' property ke andar hota hai
          videoUrl = videoUrl.url || videoUrl.link || Object.values(videoUrl)[0];
      }

      if (!videoUrl || typeof videoUrl !== 'string') {
          return extra.reply("❌ *Error:* Video link nahi mil saka. API response: " + JSON.stringify(json));
      }

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
          
