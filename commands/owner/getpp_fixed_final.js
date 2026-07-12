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
        const ctx = msg.message?.extendedTextMessage?.contextInfo
          || msg.message?.imageMessage?.contextInfo
          || msg.message?.videoMessage?.contextInfo
          || msg.message?.documentMessage?.contextInfo
          || msg.message?.stickerMessage?.contextInfo
          || msg.message?.audioMessage?.contextInfo;

        if (ctx?.participant) {
          targetJid = ctx.participant;
        }
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
            return extra.reply('❌ LID ko phone number mein resolve nahi kar saka.');
          }
        } catch (err) {
          return extra.reply('❌ LID resolve karne mein masla hua.');
        }
      }

      // ──────────────────────────────────────────────
      // 6. JID normalize karo
      // ──────────────────────────────────────────────
      targetJid = normalizeJid(targetJid);

      // ──────────────────────────────────────────────
      // 7. Profile Picture fetch karo — RETRY LOGIC ke sath
      // ──────────────────────────────────────────────
      // WhatsApp anti-scraping ki wajah se "not-authorized" error aata hai
      // Is liye retry + delay lagaya hai
      let ppUrl = null;
      const maxRetries = 3;

      // ── High-res (image) try karo ──
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          ppUrl = await sock.profilePictureUrl(targetJid, 'image');
          break; // Mil gayi, loop se bahar
        } catch (err) {
          const errStr = err.message || err.toString();
          console.log(`High-res PP attempt ${attempt}/${maxRetries} failed for ${targetJid}: ${errStr}`);

          // Agar "not-authorized" hai to WhatsApp server ne block kiya
          // Retry karo lekin kam delay ke sath
          if (errStr.toLowerCase().includes('not-authorized') || errStr.toLowerCase().includes('bad-request')) {
            if (attempt < maxRetries) {
              await new Promise(res => setTimeout(res, 2000 * attempt)); // 2s, 4s delay
            }
          } else {
            // Koi aur error — break karo, retry na karo
            break;
          }
        }
      }

      // ── Agar high-res nahi mili to preview try karo ──
      if (!ppUrl) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            ppUrl = await sock.profilePictureUrl(targetJid, 'preview');
            break;
          } catch (err) {
            const errStr = err.message || err.toString();
            console.log(`Preview PP attempt ${attempt}/${maxRetries} failed for ${targetJid}: ${errStr}`);

            if (errStr.toLowerCase().includes('not-authorized') || errStr.toLowerCase().includes('bad-request')) {
              if (attempt < maxRetries) {
                await new Promise(res => setTimeout(res, 2000 * attempt));
              }
            } else {
              break;
            }
          }
        }
      }

      // ──────────────────────────────────────────────
      // 8. Agar PP abhi bhi nahi mili
      // ──────────────────────────────────────────────
      if (!ppUrl) {
        const phoneNumber = extractNumber(targetJid);

        // Check karo ke kya "not-authorized" error tha — WhatsApp server block
        try {
          await sock.profilePictureUrl(targetJid, 'preview');
        } catch (checkErr) {
          const checkStr = checkErr.message || checkErr.toString();
          if (checkStr.toLowerCase().includes('not-authorized')) {
            return extra.reply(
              `❌ WhatsApp ne is user ki profile picture fetch karne se mana kar diya.\n\nYeh WhatsApp ka anti-scraping system hai. Hal filhal koi fix nahi hai.\n\nTry karein:\n• Thodi der baad dobara try karein\n• User se directly chat mein DP share karwayein\n\n📞 Number: ${phoneNumber}`
            );
          }
        }

        return extra.reply(
          `❌ Profile picture nahi mili.\n\nWajah yeh ho sakti hai:\n• User ne DP set hi nahi ki\n• DP ki privacy "Nobody" ya "My Contacts" par set hai\n• Aap us contact ko save nahi kiya\n\n📞 Number: ${phoneNumber}`
        );
      }

      // ──────────────────────────────────────────────
      // 9. Profile picture bhej do
      // ──────────────────────────────────────────────
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
      extra.reply('❌ Kuch masla ho gaya profile picture fetch karte waqt.');
    }
  }
};
