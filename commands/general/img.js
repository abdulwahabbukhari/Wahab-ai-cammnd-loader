const axios = require('axios');

module.exports = {
  name: 'img',
  aliases: ['image', 'pin', 'pint', 'imgs'],
  category: 'general',
  description: 'Search and get images from Pinterest',
  usage: '.img <query> <count>\n.img dog 5',

  async execute(sock, msg, args, extra) {
    try {
      if (!args[0]) {
        return extra.reply('❌ Search karne ke liye kuch likhein!\n\nUsage:\n.img dog\n.img dog 5 (5 images)');
      }

      // Last argument number ho to woh count hai, warna default 1
      let count = 1;
      let queryArgs = [...args];

      const lastArg = args[args.length - 1];
      if (/^\d+$/.test(lastArg)) {
        count = parseInt(lastArg, 10);
        queryArgs = args.slice(0, -1);
      }

      const query = queryArgs.join(' ').trim();
      if (!query) {
        return extra.reply('❌ Search karne ke liye kuch likhein!\n\nUsage:\n.img dog\n.img dog 5 (5 images)');
      }

      // Max 10 images ek baar mein (spam/abuse se bachne ke liye)
      count = Math.min(Math.max(count, 1), 10);

      const res = await axios.get(`https://allstars-apis.vercel.app/pinterest?search=${encodeURIComponent(query)}`);
      const data = res.data;

      if (!data?.data || !Array.isArray(data.data) || data.data.length === 0) {
        return extra.reply(`❌ "${query}" ke liye koi image nahi mili.`);
      }

      // Duplicate URLs hata kar unique images lena (API mein repeat URLs aate hain)
      const uniqueImages = [...new Set(data.data)];
      const selectedImages = uniqueImages.slice(0, count);

      if (selectedImages.length === 0) {
        return extra.reply(`❌ "${query}" ke liye koi image nahi mili.`);
      }

      for (let i = 0; i < selectedImages.length; i++) {
        await sock.sendMessage(extra.from, {
          image: { url: selectedImages[i] },
          caption: i === 0 ? `🖼️ *${query}* (${selectedImages.length} image${selectedImages.length > 1 ? 's' : ''})` : undefined
        }, { quoted: msg });
      }

    } catch (error) {
      console.error('img command error:', error.message);
      return extra.reply('❌ Images fetch karte waqt error aya. Dobara try karein.');
    }
  }
};
