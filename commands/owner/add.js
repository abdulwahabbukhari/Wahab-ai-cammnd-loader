const { normalizeJid, resolveLidToPn, extractNumber } = require('../../utils/jidHelper');

module.exports = {
  name: 'add',
  aliases: ['invite', 'addmember'],
  category: 'owner',
  ownerOnly: true,
  description: 'Add one or multiple members to the group using their numbers',
  usage: '.add 923001234567 923009876543 923005554433',

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
        return extra.reply('❌ Bot ko pehle group admin banayein, phir add command kaam karegi!');
      }

      if (!args[0]) {
        return extra.reply('❌ Number(s) dein jinhe add karna hai!\n\nUsage:\n.add 923001234567\n.add 923001234567 923009876543 923005554433');
      }

      // Har argument se number nikalna, khaali/invalid hata dena
      const numbers = args
        .map(a => a.replace(/[^0-9]/g, ''))
        .filter(n => n && n.length >= 8);

      if (numbers.length === 0) {
        return extra.reply('❌ Sahi number(s) dein, country code ke saath!\n\nExample: .add 923001234567');
      }

      const results = {
        added: [],
        alreadyIn: [],
        failed: []
      };

      for (const num of numbers) {
        const targetJid = normalizeJid(`${num}@s.whatsapp.net`);
        const targetNumber = extractNumber(targetJid);

        const alreadyIn = groupMetadata.participants.some(
          p => extractNumber(p.id) === targetNumber
        );
        if (alreadyIn) {
          results.alreadyIn.push(targetNumber);
          continue;
        }

        try {
          const result = await sock.groupParticipantsUpdate(extra.from, [targetJid], 'add');
          const status = result?.[0]?.status;

          if (status === '200' || status === 200 || !status) {
            results.added.push(targetNumber);
          } else {
            results.failed.push(targetNumber);
          }
        } catch (err) {
          results.failed.push(targetNumber);
        }

        // Thoda delay har add ke darmiyan, taake WhatsApp rate-limit/ban na kare
        await new Promise(r => setTimeout(r, 1500));
      }

      let summary = `📋 *Add Results*\n\n`;
      if (results.added.length) {
        summary += `✅ *Added (${results.added.length}):*\n${results.added.map(n => `• ${n}`).join('\n')}\n\n`;
      }
      if (results.alreadyIn.length) {
        summary += `⚠️ *Already in group (${results.alreadyIn.length}):*\n${results.alreadyIn.map(n => `• ${n}`).join('\n')}\n\n`;
      }
      if (results.failed.length) {
        summary += `❌ *Failed (${results.failed.length}) — privacy settings ya blocked:*\n${results.failed.map(n => `• ${n}`).join('\n')}`;
      }

      return extra.reply(summary.trim());

    } catch (error) {
      console.error('add command error:', error.message);
      return extra.reply('❌ Add karte waqt error aya. Bot ke admin permissions check karein.');
    }
  }
};
