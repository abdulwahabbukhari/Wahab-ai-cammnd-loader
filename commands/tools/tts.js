const axios = require('axios');

module.exports = {
  name: 'tts',
  aliases: ['texttospeech', 'speak'],
  category: 'general',
  description: 'Convert text to speech (audio)',
  usage: '.tts <text>',

  async execute(sock, msg, args, extra) {
    try {
      const text = args.join(' ').trim();

      if (!text) {
        return extra.reply('❌ Text dein jo bolna hai!\n\nUsage:\n.tts Hello, kaise ho aap?');
      }

      const apiUrl = `https://gtts-api-upgrade.up.railway.app/tts?text=${encodeURIComponent(text)}&lang=en`;

      const res = await axios.get(apiUrl, { responseType: 'arraybuffer', timeout: 30000 });
      const audioBuffer = Buffer.from(res.data);

      // Normal audio message ki tarah bhejte hain (ptt: false) — yeh
      // format-issues se paak hai, guaranteed chalega har device par.
      await sock.sendMessage(extra.from, {
        audio: audioBuffer,
        mimetype: 'audio/mpeg',
        ptt: false
      }, { quoted: msg });

    } catch (error) {
      console.error('tts command error:', error.message);
      return extra.reply('❌ TTS generate karte waqt error aya. Dobara try karein.');
    }
  }
};
