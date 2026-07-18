module.exports = {
  name: 'cid',
  aliases: ['newsletter', 'channelinfo', 'cinfo'],
  category: 'general',
  description: 'Get WhatsApp Channel info from link',
  usage: '.cid https://whatsapp.com/channel/xxxxxxxxx',

  async execute(sock, msg, args, extra) {
    try {
      const q = args.join(' ').trim();

      if (!q) {
        return extra.reply('❎ Please provide a WhatsApp Channel link.\n\n*Example:* .cid https://whatsapp.com/channel/123456789');
      }

      const match = q.match(/whatsapp\.com\/channel\/([\w-]+)/);
      if (!match) {
        return extra.reply('⚠️ *Invalid channel link format.*\n\nMake sure it looks like:\nhttps://whatsapp.com/channel/xxxxxxxxx');
      }

      const inviteId = match[1];

      let metadata;
      try {
        metadata = await sock.newsletterMetadata('invite', inviteId);
      } catch (e) {
        return extra.reply('❌ Failed to fetch channel metadata. Make sure the link is correct.');
      }

      if (!metadata || !metadata.id) {
        return extra.reply('❌ Channel not found or inaccessible.');
      }

      const infoText = `*— 乂 Channel Info —*\n\n` +
        `🆔 *ID:* ${metadata.id}\n` +
        `📌 *Name:* ${metadata.name}\n` +
        `👥 *Followers:* ${metadata.subscribers?.toLocaleString() || 'N/A'}\n` +
        `📅 *Created on:* ${metadata.creation_time ? new Date(metadata.creation_time * 1000).toLocaleString('id-ID') : 'Unknown'}`;

      if (metadata.preview) {
        await sock.sendMessage(extra.from, {
          image: { url: `https://pps.whatsapp.net${metadata.preview}` },
          caption: infoText
        }, { quoted: msg });
      } else {
        await extra.reply(infoText);
      }

    } catch (error) {
      console.error('❌ Error in .cid plugin:', error);
      return extra.reply('⚠️ An unexpected error occurred.');
    }
  }
};
