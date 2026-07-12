const { normalizeJid, resolveLidToPn, extractNumber } = require('../../utils/jidHelper');

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

      // Bot khud group mein admin hai ya nahi, yeh check karna
      const groupMetadata = await sock.groupMetadata(extra.from);
      const botJid = normalizeJid(sock.user.id);
      const botNumber = extractNumber(botJid);

      const botParticipant = groupMetadata.participants.find(
        p => extractNumber(p.id) === botNumber
      );

      if (!botParticipant || !['admin', 'superadmin'].includes(botParticipant.admin)) {
        return extra.reply('❌ Bot ko pehle group admin banayein, phir kick command kaam karegi!');
      }

      const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
      let targetJid = contextInfo?.mentionedJid?.[0] || contextInfo?.participant;

      if (!targetJid && args[0]) {
        const num = args[0].replace(/[^0-9]/g, '');
        if (num) targetJid = `${num}@s.whatsapp.net`;
      }

      if (!targetJid) {
        return extra.reply('❌ Kisi ko mention karein ya unke message ko reply karke .kick likhein!\n\nUsage:\n.kick @user\n.kick (reply to someone)');
      }

      if (targetJid.includes('@lid')) {
        targetJid = await resolveLidToPn(sock, targetJid);
      }
      targetJid = normalizeJid(targetJid);
      const targetNumber = extractNumber(targetJid);

      // Safety checks
      if (targetNumber === botNumber) {
        return extra.reply('❌ Main khud ko kick nahi kar sakta! 😅');
      }
      if (targetNumber === extractNumber(extra.sender)) {
        return extra.reply('❌ Aap khud ko kick nahi kar sakte!');
      }

      const targetParticipant = groupMetadata.participants.find(
        p => extractNumber(p.id) === targetNumber
      );
      if (!targetParticipant) {
        return extra.reply('❌ Yeh user is group mein maujood nahi hai!');
      }

      await sock.groupParticipantsUpdate(extra.from, [targetJid], 'remove');
      return extra.reply(`✅ Successfully removed *${targetNumber}* from the group!`);

    } catch (error) {
      console.error('kick command error:', error.message);
      return extra.reply('❌ Kick karte waqt error aya. Bot ke admin permissions check karein.');
    }
  }
};
