const { extractNumber } = require('../../utils/jidHelper');
const { checkBotAdmin, findParticipant, resolveTargetJid } = require('../../utils/groupHelper');

module.exports = {
  name: 'kick',
  aliases: ['remove', 'out', 'boot'],
  category: 'owner',
  ownerOnly: true,
  description: 'Remove a member from the group (mention or reply)',
  usage: '.kick @user or reply .kick',

  async execute(sock, msg, args, extra) {
    try {
      if (!extra.isGroup) {
        return extra.reply('❌ Yeh command sirf group mein kaam karti hai!');
      }

      const groupMetadata = await sock.groupMetadata(extra.from);
      const { isAdmin, botNumber } = await checkBotAdmin(sock, groupMetadata);

      if (!isAdmin) {
        return extra.reply('❌ Bot ko pehle group admin banayein, phir kick command kaam karegi!');
      }

      const targetJid = await resolveTargetJid(sock, msg, args);
      if (!targetJid) {
        // Koi target nahi diya (na mention, na reply, na number) — bot khud group leave kar dega
        await extra.reply('👋 Koi target nahi mila — main khud is group ko leave kar raha hoon...');
        await sock.groupLeave(extra.from);
        return;
      }

      const targetNumber = extractNumber(targetJid);

      if (targetNumber === botNumber) {
        return extra.reply('❌ Main khud ko kick nahi kar sakta! 😅');
      }
      if (targetNumber === extractNumber(extra.sender)) {
        return extra.reply('❌ Aap khud ko kick nahi kar sakte!');
      }

      const targetParticipant = await findParticipant(sock, groupMetadata.participants, targetNumber);
      if (!targetParticipant) {
        return extra.reply('❌ Yeh user is group mein maujood nahi hai!');
      }

      await sock.groupParticipantsUpdate(extra.from, [targetParticipant.id], 'remove');
      return extra.reply(`✅ Successfully removed *${targetNumber}* from the group!`);

    } catch (error) {
      console.error('kick command error:', error);
      return extra.reply(`❌ DEBUG ERROR: ${error.message}`);
    }
  }
};
