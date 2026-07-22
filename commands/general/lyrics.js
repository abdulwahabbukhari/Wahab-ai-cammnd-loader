const axios = require('axios');

// Common language names/codes jo log likh sakte hain -> ISO-1 code
// (Musixmatch translate parameter ke liye)
const LANGUAGE_MAP = {
  urdu: 'ur', ur: 'ur',
  hindi: 'hi', hi: 'hi',
  english: 'en', en: 'en',
  arabic: 'ar', ar: 'ar',
  spanish: 'es', es: 'es',
  french: 'fr', fr: 'fr',
  german: 'de', de: 'de',
  turkish: 'tr', tr: 'tr',
  persian: 'fa', farsi: 'fa', fa: 'fa',
  punjabi: 'pa', pa: 'pa',
  bengali: 'bn', bn: 'bn',
  chinese: 'zh', zh: 'zh',
  japanese: 'ja', ja: 'ja',
  korean: 'ko', ko: 'ko',
  russian: 'ru', ru: 'ru',
  portuguese: 'pt', pt: 'pt',
  italian: 'it', it: 'it'
};

module.exports = {
  name: 'lyrics',
  aliases: ['lirik', 'songlyrics', 'geet'],
  category: 'general',
  description: 'Get lyrics of a song by name, optionally translated to a language',
  usage: '.lyrics <song name>\n.lyrics <song name> <language>',

  async execute(sock, msg, args, extra) {
    try {
      if (!args[0]) {
        return extra.reply('❌ Song ka naam dein!\n\nUsage:\n.lyrics perfect ed sheeran\n.lyrics perfect ed sheeran urdu');
      }

      // Check karo last word koi supported language to nahi
      let queryArgs = [...args];
      let translateLang = null;

      const lastWord = args[args.length - 1].toLowerCase();
      if (LANGUAGE_MAP[lastWord]) {
        translateLang = LANGUAGE_MAP[lastWord];
        queryArgs = args.slice(0, -1);
      }

      const query = queryArgs.join(' ').trim();
      if (!query) {
        return extra.reply('❌ Song ka naam dein!\n\nUsage:\n.lyrics perfect ed sheeran\n.lyrics perfect ed sheeran urdu');
      }

      await extra.reply(`🔍 "${query}" ki lyrics dhoondi ja rahi hain${translateLang ? ` (${lastWord} mein)` : ''}...`);

      let data;

      if (translateLang) {
        // Translation sirf Musixmatch endpoint mein support hai
        const res = await axios.get(
          `https://lyrics.lewdhutao.my.eu.org/v2/musixmatch/lyrics?title=${encodeURIComponent(query)}&translate=${translateLang}`
        );
        data = res.data?.data;
      } else {
        // Normal (bina translation) — YouTube endpoint zyada reliable/wider coverage
        const res = await axios.get(
          `https://lyrics.lewdhutao.my.eu.org/v2/youtube/lyrics?title=${encodeURIComponent(query)}`
        );
        data = res.data?.data;
      }

      if (!data || !data.lyrics) {
        return extra.reply(`❌ "${query}" ki lyrics nahi mil saki. Naam check karein ya artist ka naam bhi add karein.`);
      }

      const caption =
        `🎵 *${data.trackName || query}*\n` +
        `🎤 *${data.artistName || 'Unknown Artist'}*` +
        `${translateLang ? `\n🌐 *Translated:* ${lastWord}` : ''}\n\n` +
        `${data.lyrics}`;

      // Lyrics kaafi lambi ho sakti hain — trim kar dete hain agar zaroorat pade
      const finalText = caption.length > 4000 ? caption.slice(0, 4000) + '\n\n... (lyrics trimmed)' : caption;

      if (data.artworkUrl) {
        await sock.sendMessage(extra.from, {
          image: { url: data.artworkUrl },
          caption: finalText
        }, { quoted: msg });
      } else {
        await extra.reply(finalText);
      }

    } catch (error) {
      console.error('lyrics command error:', error.message);
      return extra.reply('❌ Lyrics fetch karte waqt error aya. Dobara try karein.');
    }
  }
};
