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
      const prompt = `Roman Urdu mein jawab do: ${text}`;

      const res = await axios.get(
        `https://wormgpt.freeapihub.workers.dev/chat?q=${encodeURIComponent(prompt)}`
      );

      const reply =
        res.data?.response ||
        res.data?.result ||
        res.data?.message ||
        JSON.stringify(res.data);

      return extra.reply(reply);
    } catch (err) {
      console.error(err);
      return extra.reply('❌ Warm AI Error.');
    }
  }
};
