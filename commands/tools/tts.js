const axios = require('axios');

const API_KEY = 'sk_4864bd6f9c07410dbe4892fee904f32b6385408576fbd131';
const VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb';

module.exports = {
  name: 'tts',
  category: 'tools',
  description: 'Convert text to speech',

  async execute(sock, msg, args, extra) {
    const text = args.join(' ');

    if (!text) {
      return extra.reply('Example:\n.tts Assalam o Alaikum');
    }

    try {
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`,
        {
          text,
          model_id: 'eleven_multilingual_v2'
        },
        {
          responseType: 'arraybuffer',
          headers: {
            'xi-api-key': 'sk_4864bd6f9c07410dbe4892fee904f32b6385408576fbd131';
            'Content-Type': 'application/json'
          }
        }
      );

      await sock.sendMessage(
        extra.from,
        {
          audio: Buffer.from(response.data),
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
