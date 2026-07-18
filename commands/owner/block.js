const { normalizeJid, extractNumber } = require('../../utils/jidHelper');

module.exports = {
  name: 'block',
  aliases: ['blockuser'],
  category: 'owner',
  ownerOnly: true,
  description: 'Block a number, or block the user of the current DM chat',
  usage: '.block 923001234567  OR  .block (inside a user\'s DM)',

  async execute(sock, msg, args, extra) {
    try {
      let targetJid;

      if (args[0]) {
        // Case 1: Number diya gaya hai — kisi bhi chat se chala sakte hain
        const num = args[0].replace(/[^0-9]/g, '');
        if (!num || num.length < 8) {
          return extra.reply('❌ Sahi number dein, country code ke saath!\n\nExample: .block 923001234567');
        }
        targetJid = normalizeJid(`${num}@s.whatsapp.net`);
      } else {
        // Case 2: Number nahi diya — current chat ke user ko block karo (sirf DM mein)
        if (extra.isGroup) {
          return extra.reply('❌ Group mein number dena zaroori hai!\n\nUsage:\n.block 923001234567');
        }
        targetJid = normalizeJid(extra.from);
      }

      const targetNumber = extractNumber(targetJid);

      await sock.updateBlockStatus(targetJid, 'block');
      return extra.reply(`✅ *${targetNumber}* ko successfully block kar diya gaya!`);

    } catch (error) {
      console.error('block command error:', error.message);
      return extra.reply('❌ Block karte waqt error aya.');
    }
  }
};
