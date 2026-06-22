const axios = require('axios');

module.exports = {
  name: 'tts',
  category: 'tools', // Menu par show karne ke liye tools kar diya
  description: 'Text To Speech',
  usage: '.tts [your text]',

  async execute(sock, msg, args, extra) {
    const from = extra.from || msg.key.remoteJid;
    const text = args.join(' ');

    if (!text) {
      return extra.reply('Baraye meharbani text likhein!\n\n*Example:*\n.tts hello bro');
    }

    try {
      // API se data arraybuffer format mein lein ge
      const { data } = await axios.get(
        `https://tts.fastdevelopers.workers.dev/tts?voice=nova&text=${encodeURIComponent(text)}`,
        {
          responseType: 'arraybuffer'
        }
      );

      // WhatsApp Voice Note send karne ke liye settings
      await sock.sendMessage(
        from,
        {
          audio: Buffer.from(data),
          mimetype: 'audio/mp4', // MP3 (mpeg) ki jagah mp4 kar diya jo WA support karta hai
          ptt: true // Is se voice note ki tarah jaye ga
        },
        { quoted: msg }
      );

    } catch (err) {
      console.error('TTS Error:', err.response?.data || err.message);
      return extra.reply('❌ TTS Data fetch karne mein error aya hai.');
    }
  }
};
                                                                      
