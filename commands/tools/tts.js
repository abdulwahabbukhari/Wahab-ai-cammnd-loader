const axios = require('axios');

module.exports = {
  name: 'tts',
  category: 'tools',
  description: 'Text To Speech (Universal Server Fix)',
  usage: '.tts [your text]',

  async execute(sock, msg, args, extra) {
    const from = extra.from || msg.key.remoteJid;
    const text = args.join(' ');

    if (!text) {
      return extra.reply('Baraye meharbani text likhein!\n\n*Example:*\n.tts hello bro');
    }

    try {
      const url = `https://tts.fastdevelopers.workers.dev/tts?voice=nova&text=${encodeURIComponent(text)}`;
      
      const response = await axios.get(url, {
        responseType: 'arraybuffer'
      });

      const audioBuffer = Buffer.from(response.data);

      // Ultimate Hack: Is ko as a Document bhejenge audio mimetype ke sath
      // Khtambum aur WhatsApp dono chup-chap bina nakhre kiye isko direct play kar denge
      await sock.sendMessage(
        from,
        {
          document: audioBuffer,
          mimetype: 'audio/mpeg',
          fileName: `TTS_${Date.now()}.mp3`
        },
        { quoted: msg }
      );

    } catch (err) {
      console.error('TTS Ultimate Error:', err.message);
      return extra.reply('❌ TTS Error: Server bypassed protection failed.');
    }
  }
};

