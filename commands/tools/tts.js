const axios = require('axios');

module.exports = {
  name: 'tts',
  category: 'tools',
  description: 'Text To Speech',

  async execute(sock, msg, args, extra) {
    const text = args.join(' ');

    if (!text) {
      return extra.reply('Example:\n.tts Assalam o Alaikum');
    }

    try {
      const audioUrl =
        `https://tts.fastdevelopers.workers.dev/tts?voice=nova&text=${encodeURIComponent(text)}`;

      await sock.sendMessage(
        extra.from,
        {
          audio: { url: audioUrl },
          mimetype: 'audio/mpeg',
          ptt: true
        },
        { quoted: msg }
      );

    } catch (err) {
      console.error('TTS Error:', err.message);
      return extra.reply('❌ TTS Error.');
    }
  }
};
