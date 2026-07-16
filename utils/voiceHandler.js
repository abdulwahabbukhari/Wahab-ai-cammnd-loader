const fs = require('fs');
const path = require('path');
const os = require('os');
const { GoogleGenAI } = require('@google/genai');
const gTTS = require('gtts');

// ffmpeg SAFELY optional load karte hain — agar system mein ffmpeg binary
// nahi hai, ya package load fail ho, to bot crash NAHI hoga, bas OGG
// conversion skip ho kar MP3 hi bhej dega (jaisa pehle chal raha tha).
let ffmpeg = null;
try {
  ffmpeg = require('fluent-ffmpeg');
} catch (e) {
  console.log('[VOICE] fluent-ffmpeg not installed — voice notes will use MP3 format.');
}

/**
 * Voice note (audio buffer) ko seedha Gemini AI ko bhejti hai — Gemini khud
 * audio samajh kar Roman Urdu mein natural jawab deta hai. Alag STT step ki
 * zaroorat nahi, kyunki Gemini audio-understanding khud handle karta hai.
 *
 * @param {Buffer} audioBuffer downloaded voice-note audio
 * @param {string} personaPrompt bot ki persona/rules (jaisa text-chatbot mein hai)
 * @returns {Promise<string|null>} AI ka text jawab ya null (fail hone par)
 */
async function getVoiceAIReply(audioBuffer, personaPrompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY .env mein set nahi hai!');
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const audioBase64 = audioBuffer.toString('base64');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { inlineData: { mimeType: 'audio/ogg', data: audioBase64 } },
        { text: `${personaPrompt}\n\nUser ne yeh voice message bheja hai. Iska jawab Roman Urdu mein short, natural aur friendly andaz mein dein — jaise ek insaan baat kar raha ho.` }
      ]
    });

    if (!response.text) {
      const finishReason = response.candidates?.[0]?.finishReason;
      const safetyRatings = JSON.stringify(response.candidates?.[0]?.safetyRatings || response.promptFeedback || {});
      throw new Error(`Gemini empty response | finishReason: ${finishReason} | safety: ${safetyRatings}`);
    }

    return response.text.trim();
  } catch (err) {
    console.error('[VOICE] Gemini AI error:', err.message);
    throw err; // Debug ke liye upar throw karo taake handler.js mein exact error dikhe
  }
}

/**
 * Text ko Urdu awaz (gTTS) mein convert karke MP3 buffer return karti hai.
 * @param {string} text jo bolna hai
 * @returns {Promise<Buffer|null>} audio buffer ya null (fail hone par)
 */
async function textToSpeech(text) {
  const tempDir = path.join(os.tmpdir());
  const mp3Path = path.join(tempDir, `tts_${Date.now()}.mp3`);
  const oggPath = path.join(tempDir, `tts_${Date.now()}.ogg`);

  try {
    // Note: npm 'gtts' package 'ur' (Urdu) support nahi karta (purana/limited port hai).
    // 'hi' (Hindi) use karte hain — bolne mein Urdu se almost identical hai,
    // sirf likhne ka script farq hota hai, awaz mein koi farq mehsoos nahi hoga.
    const gtts = new gTTS(text, 'hi');

    await new Promise((resolve, reject) => {
      gtts.save(mp3Path, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    // Agar system mein ffmpeg available hai, OGG/Opus mein convert karo
    // (WhatsApp PTT ke liye zyada reliable format). Agar na ho ya fail ho,
    // safely MP3 hi return kar dete hain — bot crash nahi hoga.
    if (ffmpeg) {
      try {
        await new Promise((resolve, reject) => {
          ffmpeg(mp3Path)
            .audioCodec('libopus')
            .audioChannels(1)
            .toFormat('ogg')
            .on('end', resolve)
            .on('error', reject)
            .save(oggPath);
        });

        const oggBuffer = fs.readFileSync(oggPath);
        return { buffer: oggBuffer, format: 'ogg' };
      } catch (ffmpegErr) {
        console.log('[VOICE] OGG conversion failed, falling back to MP3:', ffmpegErr.message);
      }
    }

    // Fallback: MP3 hi bhej dein
    const mp3Buffer = fs.readFileSync(mp3Path);
    return { buffer: mp3Buffer, format: 'mp3' };
  } catch (err) {
    console.error('[VOICE] TTS error:', err.message);
    return null;
  } finally {
    if (fs.existsSync(mp3Path)) fs.unlinkSync(mp3Path);
    if (fs.existsSync(oggPath)) fs.unlinkSync(oggPath);
  }
}

module.exports = { getVoiceAIReply, textToSpeech };
