const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'setbotdp',
  aliases: ['setpp', 'setdp', 'updatedp'],
  category: 'owner',
  ownerOnly: true,
  description: "Update bot's profile picture from a replied/captioned image",
  usage: 'Reply to an image with .setbotdp, or send image with caption .setbotdp',

  async execute(sock, msg, args, extra) {
    try {
      const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
      const quotedMessage = contextInfo?.quotedMessage;

      let targetMessage = null;
      let targetKey = null;

      // Case 1: Reply kiya gaya image
      if (quotedMessage?.imageMessage) {
        targetMessage = quotedMessage;
        targetKey = {
          ...msg.key,
          id: contextInfo.stanzaId,
          remoteJid: extra.from,
          participant: contextInfo.participant
        };
      }
      // Case 2: Image ke sath caption mein command diya gaya
      else if (msg.message?.imageMessage) {
        targetMessage = msg.message;
        targetKey = msg.key;
      }

      if (!targetMessage) {
        return extra.reply('❌ Kisi image ko reply karein ya image ke sath caption mein .setbotdp likhein!\n\nUsage:\nImage ko reply karein → .setbotdp');
      }

      const { downloadMediaMessage } = require('@whiskeysockets/baileys');
      const imageBuffer = await downloadMediaMessage(
        { message: targetMessage, key: targetKey },
        'buffer',
        {},
        { logger: undefined, reuploadRequest: sock.updateMediaMessage }
      );

      // Local backup/reference file bhi save karte hain: units/bot_image.jpg
      const unitsDir = path.join(__dirname, '../../units');
      if (!fs.existsSync(unitsDir)) fs.mkdirSync(unitsDir, { recursive: true });
      const localImagePath = path.join(unitsDir, 'bot_image.jpg');
      fs.writeFileSync(localImagePath, imageBuffer);

      const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
      await sock.updateProfilePicture(botJid, imageBuffer);

      return extra.reply('✅ Bot ki profile picture successfully update ho gayi!\n💾 Local copy bhi save ho gayi: units/bot_image.jpg\n\n⏳ Note: WhatsApp par nayi DP dikhne mein kabhi kabhi kuch minute lag sakte hain (WhatsApp ka apna cache) — turant na dikhe to thodi der baad check karein ya app restart karein.');

    } catch (error) {
      console.error('setbotdp command error:', error.message);
      return extra.reply('❌ Profile picture update karte waqt error aya.');
    }
  }
};
