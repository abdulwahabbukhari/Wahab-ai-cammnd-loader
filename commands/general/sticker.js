const sharp = require('sharp');

module.exports = {
  name: 'sticker',
  aliases: ['s', 'stiker'],
  category: 'general',
  description: 'Convert a replied image into a WhatsApp sticker',
  usage: 'Reply to an image with .sticker',

  async execute(sock, msg, args, extra) {
    try {
      const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
      const quotedMessage = contextInfo?.quotedMessage;

      let targetMessage = quotedMessage;
      let targetKey = quotedMessage
        ? { ...msg.key, id: contextInfo.stanzaId, remoteJid: extra.from, participant: contextInfo.participant }
        : msg.key;

      if (!targetMessage) {
        const directContent = msg.message?.imageMessage;
        if (directContent) {
          targetMessage = msg.message;
          targetKey = msg.key;
        }
      }

      if (!targetMessage || !targetMessage.imageMessage) {
        return extra.reply('❌ Kisi image ko reply karke .sticker likhein!\n\nUsage:\nImage ko reply karein → .sticker');
      }

      const { downloadMediaMessage } = require('@whiskeysockets/baileys');
      const imageBuffer = await downloadMediaMessage(
        { message: targetMessage, key: targetKey },
        'buffer',
        {},
        { logger: undefined, reuploadRequest: sock.updateMediaMessage }
      );

      // sharp se 512x512 WebP mein convert karna — WhatsApp sticker ki official requirement
      const stickerBuffer = await sharp(imageBuffer)
        .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .webp({ quality: 80 })
        .toBuffer();

      await sock.sendMessage(extra.from, { sticker: stickerBuffer }, { quoted: msg });

    } catch (error) {
      console.error('sticker command error:', error.message);
      return extra.reply('❌ Sticker banate waqt error aya. Image format check karein.');
    }
  }
};
