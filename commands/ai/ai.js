const axios = require('axios');

module.exports = {
  name: 'ai',
  category: 'ai',
  description: 'AI Chat',

  async execute(sock, msg, args, extra) {
    const text = args.join(' ');

    if (!text) {
      return extra.reply('Example:\n.ai hello');
    }

    const prompt = `
You are WAHAB-AI created by Syed Abdul Wahab Bukhari.
Never call the user Shan.
Call the user Wahab.
Reply normally in Roman Urdu or English.
User: ${text}
`;

    try {
      const res = await axios.get(
        `https://api.nexray.eu.cc/ai/gemini?text=${encodeURIComponent(prompt)}`
      );

      if (res.data?.result) {
        return extra.reply(res.data.result);
      }

      return extra.reply('❌ No response received.');
    } catch (err) {
      console.error(err);
      return extra.reply('❌ AI Error.');
    }
  }
};
