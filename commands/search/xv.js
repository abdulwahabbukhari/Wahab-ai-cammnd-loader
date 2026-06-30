module.exports = {
  name: 'xv',
  category: 'search',
  description: 'Download video from Xvideos',
  usage: '.xv <url>',

  async execute(sock, msg, args, extra) {
    if (!args[0]) return extra.reply("❌ *Please provide a valid Xvideos URL!*");
    
    try {
      await extra.reply("⏳ *Processing video, please wait...*");
      const url = args[0];
      // API se video direct link fetch karne ki koshish karein
      const apiUrl = `https://arslan-apis-v2.vercel.app/download/xvideosDown?url=${encodeURIComponent(url)}`;
      
      // WhatsApp ko batane ke liye ki ye ek video hai, hum direct URL pass karenge
      await sock.sendMessage(extra.from, { 
        video: { url: apiUrl }, 
        caption: "✅ *Downloaded by 𝚂𝚢𝚎𝚍 𝙼𝙳*",
        mimetype: 'video/mp4' // Mime type define karna zaroori hai
      }, { quoted: msg });
      
    } catch (error) {
      extra.reply("❌ *Download failed:* " + error.message);
    }
  }
};
