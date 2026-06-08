const axios = require('axios');

module.exports = {
  name: 'warm',
  category: 'ai',
  description: 'WormGPT Chat',

  async execute(sock, msg, args, extra) {
    const text = args.join(' ');

    if (!text) {
      return extra.reply('Example:\n.warm hello');
    }

    try {
      const res = await axios.get(
        `https://wormgpt.freeapihub.workers.dev/chat?q=${encodeURIComponent(text)}`
      );

      if (res.data?.reply) {
        return extra.reply(res.data.reply);
      }

      return extra.reply('❌ No response received.');
    } catch (err) {
      console.error(err);
      return extra.reply('❌ Warm AI Error.');
    }
  }
};
