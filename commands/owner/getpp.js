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
      let targetJid = null;

      // ──────────────────────────────────────────────
      // 1. MENTION se target nikaalna
      // ──────────────────────────────────────────────
      const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid
        || msg.message?.listMessage?.contextInfo?.mentionedJid;
      if (mentioned && mentioned.length > 0) {
        targetJid = mentioned[0];
      }

      // ──────────────────────────────────────────────
      // 2. REPLY se target nikaalna (agar mention nahi mila)
      // ──────────────────────────────────────────────
      if (!targetJid) {
        // Different message types mein contextInfo check karo
        const ctx = msg.message?.extendedTextMessage?.contextInfo
          || msg.message?.imageMessage?.contextInfo
          || msg.message?.videoMessage?.contextInfo
          || msg.message?.documentMessage?.contextInfo
          || msg.message?.stickerMessage?.contextInfo;

        if (ctx?.participant) {
          targetJid = ctx.participant;
        }
      }

      // Agar abhi bhi nahi mila to msg ke apne contextInfo check karo
      if (!targetJid && msg.message?.extendedTextMessage?.contextInfo?.participant) {
        targetJid = msg.message.extendedTextMessage.contextInfo.participant;
      }

      // ──────────────────────────────────────────────
      // 3. Argument mein number diya ho (fallback)
      // ──────────────────────────────────────────────
      if (!targetJid && args[0]) {
        const rawNum = args[0].replace(/[^0-9]/g, '');
        if (rawNum.length >= 7) {
          targetJid = `${rawNum}@s.whatsapp.net`;
        } else {
          return extra.reply(
            '❌ Number bohot chota hai. Complete number diya (e.g. 923001234567)\n\nUsage: `.getpp 923001234567`'
          );
        }
      }

      // ──────────────────────────────────────────────
      // 4. Agar target nahi mila
      // ──────────────────────────────────────────────
      if (!targetJid) {
        return extra.reply(
          '❌ Kisi ko mention karein, unke message ko reply karein, ya number dein!\n\nUsage:\n.getpp @user\n.getpp (reply to someone)\n.getpp 923001234567'
        );
      }

      // ──────────────────────────────────────────────
      // 5. LID format ho to resolve karo asal number mein
      // ──────────────────────────────────────────────
      if (targetJid.includes('@lid')) {
        try {
          targetJid = await resolveLidToPn(sock, targetJid);
          if (!targetJid) {
            return extra.reply('❌ LID ko phone number mein resolve nahi kar saka. Shayad user ne LID privacy set ki ho.');
          }
        } catch (err) {
          console.error('LID resolve error:', err.message);
          return extra.reply('❌ LID resolve karne mein masla hua. Shayad user ne privacy settings lagayi ho.');
        }
      }

      // ──────────────────────────────────────────────
      // 6. JID normalize karo
      // ──────────────────────────────────────────────
      targetJid = normalizeJid(targetJid);

      // ──────────────────────────────────────────────
      // 7. Profile Picture fetch karo (high-res first, phir preview)
      // ──────────────────────────────────────────────
      let ppUrl = null;

      // Pehle high-res (image) try karo
      try {
        ppUrl = await sock.profilePictureUrl(targetJid, 'image');
      } catch (err) {
        console.log(`High-res PP nahi mili for ${targetJid}: ${err.message}`);
      }

      // Agar high-res nahi mili to preview try karo
      if (!ppUrl) {
        try {
          ppUrl = await sock.profilePictureUrl(targetJid, 'preview');
        } catch (err) {
          console.log(`Preview PP bhi nahi mili for ${targetJid}: ${err.message}`);
        }
      }

      // ──────────────────────────────────────────────
      // 8. Agar PP nahi mili to proper error message
      // ──────────────────────────────────────────────
      if (!ppUrl) {
        return extra.reply(
          `❌ Profile picture nahi mili.\n\nWajah yeh ho sakti hai:\n• User ne DP set hi nahi ki\n• DP ki privacy "Nobody" ya "My Contacts" par set hai\n• Aap us contact ko save nahi kiya\n\n📞 Number: ${extractNumber(targetJid)}`
        );
      }

      // ──────────────────────────────────────────────
      // 9. Profile picture bhej do
      // ──────────────────────────────────────────────
      await sock.sendMessage(
        extra.from,
        {
          image: { url: ppUrl },
          caption: `📸 *Profile Picture*\n📞 Number: ${extractNumber(targetJid)}\n🔗 JID: ${targetJid}`
        },
        { quoted: msg }
      );

    } catch (error) {
      console.error('getpp command error:', error.message);
      extra.reply('❌ Kuch masla ho gaya profile picture fetch karte waqt.');
    }
  }
};
