const axios = require('axios');

module.exports = {
  name: 'hadith',
  aliases: ['hadees', 'bukhari', 'muslim'],
  category: 'general',
  description: 'Sahi Bukhari aur Muslim se hadees talash karein (Arabic, Urdu, English)',
  usage: '.hadith bukhari 1',

  async execute(sock, msg, args, extra) {
    const from = extra.from || msg.key.remoteJid;

    if (!args[0] || !args[1]) {
      let helpMsg = `📖 *S Y E  D  -  M D  H A D I T H*\n\n`;
      helpMsg += `Hadith check karne ka sahi tariqa:\n`;
      helpMsg += `🔹 \`.hadith bukhari 1\` (Sahi Bukhari)\n`;
      helpMsg += `🔹 \`.hadith muslim 1\` (Sahi Muslim)\n\n`;
      helpMsg += `*Available Books:* bukhari, muslim`;
      return extra.reply(helpMsg);
    }

    let book = args[0].toLowerCase().trim();
    let hadithNumber = args[1].trim();

    // Mapping for global open source islamic api
    const bookMapping = {
      'bukhari': 'bukhari',
      'sahibukhari': 'bukhari',
      'muslim': 'muslim',
      'sahimuslim': 'muslim'
    };

    let apiBook = bookMapping[book];
    if (!apiBook) {
      return extra.reply('❌ missing book! Abhi sirf *bukhari* aur *muslim* available hain.');
    }

    try {
      await extra.reply(`🔍 *Searching:* \`${apiBook.toUpperCase()} Hadees No. ${hadithNumber}\`...\n⚡ Fetching Arabic, Urdu & English text.`);

      // 100% Free Public API - No Key Required
      const apiUrl = `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/urd-${apiBook}/${hadithNumber}.json`;
      const arabicUrl = `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-${apiBook}/${hadithNumber}.json`;
      const englishUrl = `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-${apiBook}/${hadithNumber}.json`;

      let urduText = '', arabicText = '', englishText = '';

      // Fetch Urdu
      try {
        const resUrdu = await axios.get(apiUrl);
        urduText = resUrdu.data.hadith[0]?.text || resUrdu.data.text;
      } catch (e) { console.log('Urdu missing'); }

      // Fetch Arabic
      try {
        const resAra = await axios.get(arabicUrl);
        arabicText = resAra.data.hadith[0]?.text || resAra.data.text;
      } catch (e) { console.log('Arabic missing'); }

      // Fetch English
      try {
        const resEng = await axios.get(englishUrl);
        englishText = resEng.data.hadith[0]?.text || resEng.data.text;
      } catch (e) { console.log('English missing'); }

      if (!urduText && !arabicText && !englishText) {
        return extra.reply(`❌ Sorry bhai, Hadees number \`${hadithNumber}\` data nahi mila.`);
      }

      let finalResponse = `📜 *H A D I T H  -  I N F O*\n`;
      finalResponse += `📋 *Book:* ${apiBook.toUpperCase()} | *No:* ${hadithNumber}\n`;
      finalResponse += `────────────────────\n\n`;
      
      if (arabicText) {
        finalResponse += `🟢 *Arabic:* \n_${arabicText}_\n\n`;
        finalResponse += `────────────────────\n\n`;
      }
      
      if (urduText) {
        finalResponse += `🇵🇰 *Urdu Translation:* \n*${urduText}*\n\n`;
        finalResponse += `────────────────────\n\n`;
      }
      
      if (englishText) {
        finalResponse += `🇬🇧 *English Translation:* \n_${englishText}_\n\n`;
        finalResponse += `────────────────────\n`;
      }
      
      finalResponse += `Powered by *SYED ABDUL WAHAB BUKHARI*`;

      return await sock.sendMessage(from, { text: finalResponse }, { quoted: msg });

    } catch (err) {
      console.error('Hadith API Error:', err.message);
      return extra.reply('❌ *Error:* Hadees fetch karne me masla aaya. Number check karein ya baad me try karein.');
    }
  }
};
        
