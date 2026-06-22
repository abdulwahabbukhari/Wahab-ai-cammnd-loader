const axios = require('axios');

module.exports = {
  name: 'tts',
  category: 'tools',
  description: 'Text To Speech (Cloud Load Fixed)',
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

      // Khtambum Server ke load error ko bypass karne ke liye proper stream property
      await sock.sendMessage(
        from,
        {
          audio: audioBuffer,
          mimetype: 'audio/mp4', // MP4 container load error ko hal karta hai
          ptt: false,
          seconds: 15, // File duration manually pass karne se load ka error khatam ho jata hai
        },
        { quoted: msg }
      );

    } catch (err) {
      console.error('TTS Load Error:', err.message);
      return extra.reply('❌ TTS Error: Server media load failed.');
    }
  }
};
    
