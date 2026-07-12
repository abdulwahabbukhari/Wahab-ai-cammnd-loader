const { normalizeJid, resolveLidToPn, extractNumber } = require('../../utils/jidHelper');

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
      const botJid = normalizeJid(sock.user.id);
      const botNumber = extractNumber(botJid);

      let botParticipant = groupMetadata.participants.find(
        p => extractNumber(p.id) === botNumber
      );

      if (!botParticipant) {
        for (const p of groupMetadata.participants) {
          if (p.id.includes('@lid')) {
            const resolved = await resolveLidToPn(sock, p.id);
            if (extractNumber(resolved) === botNumber) {
              botParticipant = p;
              break;
            }
          }
        }
      }

      if (!botParticipant || !['admin', 'superadmin'].includes(botParticipant.admin)) {
        return extra.reply('❌ Bot ko pehle group admin banayein, phir demote command kaam karegi!');
      }

      const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
      let targetJid = contextInfo?.mentionedJid?.[0] || contextInfo?.participant;

      if (!targetJid && args[0]) {
        const num = args[0].replace(/[^0-9]/g, '');
        if (num) targetJid = `${num}@s.whatsapp.net`;
      }

      if (!targetJid) {
        return extra.reply('❌ Kisi ko mention karein ya unke message ko reply karke .demote likhein!\n\nUsage:\n.demote @user\n.demote (reply to someone)');
      }

      if (targetJid.includes('@lid')) {
        targetJid = await resolveLidToPn(sock, targetJid);
      }
      targetJid = normalizeJid(targetJid);
      const targetNumber = extractNumber(targetJid);

      const targetParticipant = groupMetadata.participants.find(
        p => extractNumber(p.id) === targetNumber
      );
      if (!targetParticipant) {
        return extra.reply('❌ Yeh user is group mein maujood nahi hai!');
      }

      if (!['admin', 'superadmin'].includes(targetParticipant.admin)) {
        return extra.reply('⚠️ Yeh user admin hai hi nahi!');
      }

      await sock.groupParticipantsUpdate(extra.from, [targetJid], 'demote');
      return extra.reply(`✅ Successfully demoted *${targetNumber}* to regular member!`);

    } catch (error) {
      console.error('demote command error:', error.message);
      return extra.reply('❌ Demote karte waqt error aya. Bot ke admin permissions check karein.');
    }
  }
}; 
