const fs = require('fs');
const path = require('path');
const os = require('os');
const { GoogleGenAI } = require('@google/genai');
const gTTS = require('gtts');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

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

    // WhatsApp PTT (voice note) Android par MP3 ke sath reliably kaam nahi karta —
    // OGG/Opus mein convert karna zaroori hai taake har device par chale.
    await new Promise((resolve, reject) => {
      ffmpeg(mp3Path)
        .audioCodec('libopus')
        .audioChannels(1)
        .toFormat('ogg')
        .on('end', resolve)
        .on('error', reject)
        .save(oggPath);
    });

    const buffer = fs.readFileSync(oggPath);
    return buffer;
  } catch (err) {
    console.error('[VOICE] TTS error:', err);
    throw err; // Debug ke liye upar throw karo taake handler.js mein exact error dikhe
  } finally {
    if (fs.existsSync(mp3Path)) fs.unlinkSync(mp3Path);
    if (fs.existsSync(oggPath)) fs.unlinkSync(oggPath);
  }
}

module.exports = { getVoiceAIReply, textToSpeech };
