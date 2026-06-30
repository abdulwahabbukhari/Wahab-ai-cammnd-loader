const fetch = require('node-fetch');

module.exports = {
  name: 'xvsearch',
  category: 'search',
  description: 'Search videos on Xvideos',
  usage: '.xvsearch <query>',

  async execute(sock, msg, args, extra) {
    if (!args.length) return extra.reply("❌ *Please provide a search query!*");
    
    const query = args.join(' ');
    try {
      await extra.reply("🔍 *Searching for:* " + query + "...");
      const res = await fetch(`https://arslan-apis-v2.vercel.app/download/xvideosSearch?text=${encodeURIComponent(query)}`);
      const json = await res.json();
      
      if (!json.result || json.result.length === 0) return extra.reply("⚠️ *No results found.*");

      let txt = "🎬 *Search Results (𝚂𝚢𝚎𝚍 𝙼𝙳):*\n\n";
      json.result.forEach((v, i) => {
        txt += `${i + 1}. *Title:* ${v.title}\n🔗 *Link:* ${v.url}\n\n`;
      });
      
      await extra.reply(txt);
    } catch (error) {
      extra.reply("❌ *Error:* " + error.message);
    }
  }
};
