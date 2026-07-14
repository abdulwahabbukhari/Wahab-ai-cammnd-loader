const { normalizeJid, extractNumber } = require('../../utils/jidHelper');
const { checkBotAdmin, findParticipant } = require('../../utils/groupHelper');

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
      const { isAdmin } = await checkBotAdmin(sock, groupMetadata);

      if (!isAdmin) {
        return extra.reply('❌ Bot ko pehle group admin banayein, phir add command kaam karegi!');
      }

      if (!args[0]) {
        return extra.reply('❌ Number(s) dein jinhe add karna hai!\n\nUsage:\n.add 923001234567\n.add 923001234567 923009876543 923005554433');
      }

      const numbers = args
        .map(a => a.replace(/[^0-9]/g, ''))
        .filter(n => n && n.length >= 8);

      if (numbers.length === 0) {
        return extra.reply('❌ Sahi number(s) dein, country code ke saath!\n\nExample: .add 923001234567');
      }

      const results = { added: [], alreadyIn: [], failed: [] };

      for (const num of numbers) {
        const targetJid = normalizeJid(`${num}@s.whatsapp.net`);
        const targetNumber = extractNumber(targetJid);

        const existing = await findParticipant(sock, groupMetadata.participants, targetNumber);
        if (existing) {
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
      console.error('add command error:', error);
      return extra.reply(`❌ DEBUG ERROR: ${error.message}`);
    }
  }
};
