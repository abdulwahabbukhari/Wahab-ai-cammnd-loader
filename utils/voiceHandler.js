const fs = require('fs');
const path = require('path');
const os = require('os');
const axios = require('axios');
const FormData = require('form-data');
const { EdgeTTS } = require('node-edge-tts');

// Female Urdu-Pakistani voice — natural aur samajh aane wali awaz.
// Agar English-heavy replies aa rahi hon, is voice ko English female
// voice (jaise 'en-US-AriaNeural') se badla ja sakta hai.
const TTS_VOICE = 'ur-PK-UzmaNeural';

/**
 * Groq Whisper API se audio buffer ko text mein convert karti hai (STT).
 * @param {Buffer} audioBuffer downloaded voice-note audio
 * @returns {Promise<string|null>} transcribed text ya null (fail hone par)
 */
async function speechToText(audioBuffer) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error('[VOICE] GROQ_API_KEY .env mein set nahi hai!');
    return null;
  }

  const tempPath = path.join(os.tmpdir(), `stt_${Date.now()}.ogg`);
  try {
    fs.writeFileSync(tempPath, audioBuffer);

    const form = new FormData();
    form.append('file', fs.createReadStream(tempPath));
    form.append('model', 'whisper-large-v3');

    const res = await axios.post(
      'https://api.groq.com/openai/v1/audio/transcriptions',
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${apiKey}`
        }
      }
    );

    return res.data?.text?.trim() || null;
  } catch (err) {
    console.error('[VOICE] STT error:', err.response?.data || err.message);
    return null;
  } finally {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  }
}

/**
 * Text ko female voice (Edge TTS) mein convert karke MP3 buffer return karti hai (TTS).
 * @param {string} text jo bolna hai
 * @returns {Promise<Buffer|null>} audio buffer ya null (fail hone par)
 */
async function textToSpeech(text) {
  const tempPath = path.join(os.tmpdir(), `tts_${Date.now()}.mp3`);
  try {
    const tts = new EdgeTTS({
      voice: TTS_VOICE,
      lang: 'ur-PK',
      outputFormat: 'audio-24khz-48kbitrate-mono-mp3'
    });

    await tts.ttsPromise(text, tempPath);

    const buffer = fs.readFileSync(tempPath);
    return buffer;
  } catch (err) {
    console.error('[VOICE] TTS error:', err.message);
    return null;
  } finally {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  }
}

module.exports = { speechToText, textToSpeech };
