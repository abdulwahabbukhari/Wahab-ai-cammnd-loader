const translate = require('@vitalets/google-translate-api').translate;

module.exports = {
  name: 'translate',
  aliases: ['tr'],
  category: 'tools',
  description: 'Translate replied text',

  async execute(sock, msg, args, extra) {
    try {
      const langInput = (args[0] || '').toLowerCase();

      if (!langInput) {
        return extra.reply(
          'Example:\nReply to a message\n.translate urdu'
        );
      }

      const languages = {
        urdu: 'ur',
        english: 'en',
        arabic: 'ar',
        hindi: 'hi',
        french: 'fr',
        german: 'de',
        spanish: 'es',
        turkish: 'tr',
        russian: 'ru',
        chinese: 'zh-cn'
      };

      const lang = languages[langInput] || langInput;

      const quoted =
        msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

      if (!quoted) {
        return extra.reply(
          '❌ Kisi text message ko reply karo phir .translate urdu use karo.'
        );
      }

      const text =
        quoted.conversation ||
        quoted.extendedTextMessage?.text ||
        '';

      if (!text) {
        return extra.reply('❌ Reply ki hui message mein text nahi mila.');
      }

      const result = await translate(text, {
        to: lang
      });

      return extra.reply(
        `🌐 Translation (${langInput})\n\n${result.text}`
      );

    } catch (err) {
      console.error(err);
      return extra.reply('❌ Translation failed.');
    }
  }
};
