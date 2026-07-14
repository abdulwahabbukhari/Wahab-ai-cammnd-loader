const { extractNumber } = require('../../utils/jidHelper');
const { checkBotAdmin, findParticipant, resolveTargetJid } = require('../../utils/groupHelper');

module.exports = {
  name: 'promote',
  aliases: ['admin', 'makeadmin'],
  category: 'owner',
  ownerOnly: true,
  description: 'Promote a member to group admin (mention or reply)',
  usage: '.promote @user or reply .promote',

  async execute(sock, msg, args, extra) {
    try {
      if (!extra.isGroup) {
        return extra.reply('❌ Yeh command sirf group mein kaam karti hai!');
      }

      const groupMetadata = await sock.groupMetadata(extra.from);
      const { isAdmin } = await checkBotAdmin(sock, groupMetadata);

      if (!isAdmin) {
        return extra.reply('❌ Bot ko pehle group admin banayein, phir promote command kaam karegi!');
      }

      const targetJid = await resolveTargetJid(sock, msg, args);
      if (!targetJid) {
        return extra.reply('❌ Kisi ko mention karein ya unke message ko reply karke .promote likhein!\n\nUsage:\n.promote @user\n.promote (reply to someone)');
      }

      const targetNumber = extractNumber(targetJid);

      const targetParticipant = await findParticipant(sock, groupMetadata.participants, targetNumber);
      if (!targetParticipant) {
        return extra.reply('❌ Yeh user is group mein maujood nahi hai!');
      }

      if (['admin', 'superadmin'].includes(targetParticipant.admin)) {
        return extra.reply('⚠️ Yeh user pehle se hi admin hai!');
      }

      await sock.groupParticipantsUpdate(extra.from, [targetParticipant.id], 'promote');
      return extra.reply(`✅ Successfully promoted *${targetNumber}* to group admin!`);

    } catch (error) {
      console.error('promote command error:', error);
      return extra.reply(`❌ DEBUG ERROR: ${error.message}`);
    }
  }
};
