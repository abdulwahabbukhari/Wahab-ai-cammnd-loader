const { normalizeJid, resolveLidToPn, extractNumber } = require('../../utils/jidHelper');

module.exports = {
  name: 'getpp',
  aliases: ['pp', 'ppic'],
  category: 'owner',
  ownerOnly: true,
  description: 'Get profile picture of a mentioned/replied/number-given user',
  usage: '.getpp (mention/reply) or .getpp 923001234567',

  async execute(sock, msg, args, extra) {
    try {
      const contextInfo = msg.message?.extendedTextMessage?.contextInfo;

      // 1. Mention se target nikaalna
      let targetJid = contextInfo?.mentionedJid?.[0];

      // 2. Reply se target nikaalna (agar mention nahi mila)
      if (!targetJid && contextInfo?.participant) {
        targetJid = contextInfo.participant;
      }

      // 3. Argument mein number diya ho (fallback)
      if (!targetJid && args[0]) {
        const num = args[0].replace(/[^0-9]/g, '');
        if (num) targetJid = `${num}@s.whatsapp.net`;
      }

      if (!targetJid) {
        return extra.reply(
          '❌ Kisi ko mention karein, unke message ko reply karein, ya number dein!\n\nUsage:\n.getpp @user\n.getpp (reply to someone)\n.getpp 923001234567'
        );
      }

      // LID format ho to resolve karo asal number mein
      if (targetJid.includes('@lid')) {
        targetJid = await resolveLidToPn(sock, targetJid);
      }
      targetJid = normalizeJid(targetJid);

      // 'image' (high-res) try karo, na mile to 'preview' (thumbnail) try karo
      let ppUrl;
      try {
        ppUrl = await sock.profilePictureUrl(targetJid, 'image');
      } catch (_) { /* no-op, preview try karenge */ }

      if (!ppUrl) {
        try {
          ppUrl = await sock.profilePictureUrl(targetJid, 'preview');
        } catch (_) { /* no-op, neeche error handle hoga */ }
      }

      if (!ppUrl) {
        return extra.reply(
          `❌ Profile picture nahi mili.\n\nWajah yeh ho sakti hai:\n• User ne DP set hi nahi ki\n• DP ki privacy "My Contacts" par set hai\n\n📞 Number: ${extractNumber(targetJid)}`
        );
      }

      await sock.sendMessage(
        extra.from,
        {
          image: { url: ppUrl },
          caption: `📸 *Profile Picture*\n📞 Number: ${extractNumber(targetJid)}`
        },
        { quoted: msg }
      );
    } catch (error) {
      console.error('getpp command error:', error.message);
      return extra.reply('❌ Kuch masla ho gaya profile picture fetch karte waqt.');
    }
  }
};
