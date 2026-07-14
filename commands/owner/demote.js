const { extractNumber } = require('../../utils/jidHelper');
const { checkBotAdmin, findParticipant, resolveTargetJid } = require('../../utils/groupHelper');

module.exports = {
  name: 'demote',
  aliases: ['unadmin', 'removeadmin'],
  category: 'owner',
  ownerOnly: true,
  description: 'Demote a group admin back to member (mention or reply)',
  usage: '.demote @user or reply .demote',

  async execute(sock, msg, args, extra) {
    try {
      if (!extra.isGroup) {
        return extra.reply('❌ Yeh command sirf group mein kaam karti hai!');
      }

      const groupMetadata = await sock.groupMetadata(extra.from);
      const { isAdmin } = await checkBotAdmin(sock, groupMetadata);

      if (!isAdmin) {
        return extra.reply('❌ Bot ko pehle group admin banayein, phir demote command kaam karegi!');
      }

      const targetJid = await resolveTargetJid(sock, msg, args);
      if (!targetJid) {
        return extra.reply('❌ Kisi ko mention karein ya unke message ko reply karke .demote likhein!\n\nUsage:\n.demote @user\n.demote (reply to someone)');
      }

      const targetNumber = extractNumber(targetJid);

      const targetParticipant = await findParticipant(sock, groupMetadata.participants, targetNumber);
      if (!targetParticipant) {
        return extra.reply('❌ Yeh user is group mein maujood nahi hai!');
      }

      if (!['admin', 'superadmin'].includes(targetParticipant.admin)) {
        return extra.reply('⚠️ Yeh user admin hai hi nahi!');
      }

      await sock.groupParticipantsUpdate(extra.from, [targetParticipant.id], 'demote');
      return extra.reply(`✅ Successfully demoted *${targetNumber}* to regular member!`);

    } catch (error) {
      console.error('demote command error:', error);
      return extra.reply(`❌ DEBUG ERROR: ${error.message}`);
    }
  }
};
