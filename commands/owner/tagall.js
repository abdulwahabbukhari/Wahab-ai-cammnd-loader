module.exports = {
  name: 'tagall',
  aliases: ['everyone', 'all', 'mentionall'],
  category: 'owner',
  ownerOnly: true,
  description: 'Tag/mention all members in the group',
  usage: '.tagall <optional message>',

  async execute(sock, msg, args, extra) {
    try {
      if (!extra.isGroup) {
        return extra.reply('❌ Yeh command sirf group mein kaam karti hai!');
      }

      const groupMetadata = await sock.groupMetadata(extra.from);
      const participants = groupMetadata.participants;

      if (!participants || participants.length === 0) {
        return extra.reply('❌ Group members ki list nahi mil saki.');
      }

      const customMessage = args.join(' ').trim();
      const mentions = participants.map(p => p.id);

      let text = customMessage
        ? `📢 *${customMessage}*\n\n`
        : `📢 *Attention Everyone!*\n\n`;

      participants.forEach((p) => {
        text += `➤ @${p.id.split('@')[0]}\n`;
      });

      await sock.sendMessage(extra.from, {
        text: text.trim(),
        mentions: mentions
      }, { quoted: msg });

    } catch (error) {
      console.error('tagall command error:', error.message);
      return extra.reply('❌ Tagall karte waqt error aya.');
    }
  }
};
