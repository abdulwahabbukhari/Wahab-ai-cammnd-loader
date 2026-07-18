const axios = require('axios');

module.exports = {
  name: 'randomimg',
  aliases: ['randimg', 'randompic', 'rimg'],
  category: 'general',
  description: 'Get a random image',
  usage: '.randomimg',

  async execute(sock, msg, args, extra) {
    try {
      const apiUrl = 'https://jawad-tech.vercel.app/random/ba';

      // API seedha image binary return karti hai, isliye arraybuffer mein fetch karte hain
      const res = await axios.get(apiUrl, { responseType: 'arraybuffer' });
      const imageBuffer = Buffer.from(res.data);

      await sock.sendMessage(extra.from, {
        image: imageBuffer,
        caption: '🖼️ *Random Image*'
      }, { quoted: msg });

    } catch (error) {
      console.error('randomimg command error:', error.message);
      return extra.reply('❌ Random image fetch karte waqt error aya. Dobara try karein.');
    }
  }
};
