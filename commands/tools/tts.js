const axios = require('axios');

module.exports = {
  name: 'tts',
  category: 'tools',
  description: 'Text To Speech',

  async execute(sock, msg, args, extra) {
    const text = args.join(' ');

    if (!text) {
      return extra.reply('Example:\n.tts hello');
    }

    try {
      const { data } = await axios.get(
        `https://tts.fastdevelopers.workers.dev/tts?voice=nova&text=${encodeURIComponent(text)}`,
        {
          responseType: 'arraybuffer'
        }
      );

      await sock.sendMessage(
        extra.from,
        {
          audio: Buffer.from(data),
          mimetype: 'audio/mpeg',
          ptt: true
        },
        { quoted: msg }
      );

    } catch (err) {
      console.error('TTS Error:', err.response?.data || err.message);
      return extra.reply('❌ TTS Error.');
    }
  }
};
