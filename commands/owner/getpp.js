const axios = require('axios');
const { normalizeJid, resolveLidToPn, extractNumber } = require('../../utils/jidHelper');

module.exports = {
  name: 'getpp',
  aliases: ['gp', 'getpic', 'pp'],
  category: 'owner',
  ownerOnly: true,
  description: 'Get profile picture of a user (reply or tag)',
  usage: '.getpp (reply to message or tag user)',

  async execute(sock, msg, args, extra) {
    try {
      let targetUser = null;

      // 1. Check if it's a reply
      const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
      const quotedMessage = contextInfo?.quotedMessage;

      if (quotedMessage && contextInfo?.participant) {
        targetUser = contextInfo.participant;
      } else if (contextInfo?.mentionedJid && contextInfo.mentionedJid.length > 0) {
        // 2. Check if user is tagged
        targetUser = contextInfo.mentionedJid[0];
      } else if (args[0]) {
        // 3. Number given as argument
        const num = args[0].replace(/[^0-9]/g, '');
        if (num) targetUser = `${num}@s.whatsapp.net`;
      } else {
        // 4. Fallback: sender of current message
        targetUser = extra.sender;
      }

      if (!targetUser) {
        return extra.reply('❌ Could not identify target user. Please reply to a message, tag a user, or give a number.');
      }

      // LID format ho to asal phone number mein resolve karo
      if (targetUser.includes('@lid')) {
        targetUser = await resolveLidToPn(sock, targetUser);
      }
      targetUser = normalizeJid(targetUser);
      const targetNumber = extractNumber(targetUser);

      try {
        // 'image' (high-res) try karo, na mile to 'preview' try karo
        let ppUrl;
        try {
          ppUrl = await sock.profilePictureUrl(targetUser, 'image');
        } catch (_) { /* preview try karenge neeche */ }

        if (!ppUrl) {
          try {
            ppUrl = await sock.profilePictureUrl(targetUser, 'preview');
          } catch (_) { /* neeche handle hoga */ }
        }

        if (!ppUrl) {
          return extra.reply(`❌ Profile picture not found for *${targetNumber}*.`);
        }

        // Download the profile picture as buffer (more reliable than direct URL send)
        const response = await axios.get(ppUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data);

        // Send the profile picture
        await sock.sendMessage(extra.from, {
          image: buffer,
          caption: `👤 Profile picture of @${targetNumber}`,
          mentions: [targetUser]
        }, { quoted: msg });

      } catch (profileError) {
        console.error('getpp fetch error:', profileError.message);
        return extra.reply(`❌ Profile picture not found for *${targetNumber}*.\nHo sakta hai DP private ho ya set na ho.`);
      }

    } catch (error) {
      console.error('getpp command error:', error.message);
      return extra.reply('❌ Kuch masla ho gaya profile picture fetch karte waqt.');
    }
  }
};
