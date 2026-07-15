const fs = require('fs');
const path = require('path');
const os = require('os');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

module.exports = {
  name: 'sticker',
  aliases: ['s', 'stiker'],
  category: 'general',
  description: 'Convert a replied image or video into a WhatsApp sticker',
  usage: 'Reply to an image/video with .sticker',

  async execute(sock, msg, args, extra) {
    let inputPath, outputPath;
    try {
      const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
      const quotedMessage = contextInfo?.quotedMessage;

      // Target message: quoted (reply) ya khud yeh message (agar caption ke sath bheja ho)
      let targetMessage = quotedMessage;
      let targetKey = quotedMessage
        ? { ...msg.key, id: contextInfo.stanzaId, remoteJid: extra.from, participant: contextInfo.participant }
        : msg.key;

      if (!targetMessage) {
        // Reply na ho to khud is message mein image/video dhoondo (caption ke sath bheja gaya ho)
        const directContent = msg.message?.imageMessage || msg.message?.videoMessage;
        if (directContent) {
          targetMessage = msg.message;
          targetKey = msg.key;
        }
      }

      if (!targetMessage || (!targetMessage.imageMessage && !targetMessage.videoMessage)) {
        return extra.reply('❌ Kisi image ya video ko reply karke .sticker likhein!\n\nUsage:\nImage/video ko reply karein → .sticker');
      }

      const isVideo = !!targetMessage.videoMessage;

      const { downloadMediaMessage } = require('@whiskeysockets/baileys');
      const mediaBuffer = await downloadMediaMessage(
        { message: targetMessage, key: targetKey },
        'buffer',
        {},
        { logger: undefined, reuploadRequest: sock.updateMediaMessage }
      );

      const tempDir = os.tmpdir();
      const uniqueId = Date.now();
      inputPath = path.join(tempDir, `sticker_input_${uniqueId}.${isVideo ? 'mp4' : 'jpg'}`);
      outputPath = path.join(tempDir, `sticker_output_${uniqueId}.webp`);

      fs.writeFileSync(inputPath, mediaBuffer);

      await new Promise((resolve, reject) => {
        let cmd = ffmpeg(inputPath);

        if (isVideo) {
          // Animated sticker: 512x512 max, 6 second cap, ~10fps, WhatsApp-friendly WebP
          cmd = cmd
            .duration(6)
            .videoFilters('scale=512:512:force_original_aspect_ratio=decrease,fps=10,pad=512:512:-1:-1:color=white@0.0')
            .outputOptions(['-loop', '0', '-preset', 'default', '-an', '-vsync', '0'])
            .toFormat('webp');
        } else {
          // Static sticker: 512x512, transparent padding
          cmd = cmd
            .videoFilters('scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:-1:-1:color=white@0.0')
            .outputOptions(['-vcodec', 'libwebp', '-lossless', '0', '-q:v', '75'])
            .toFormat('webp');
        }

        cmd.on('end', resolve).on('error', reject).save(outputPath);
      });

      const stickerBuffer = fs.readFileSync(outputPath);

      await sock.sendMessage(extra.from, { sticker: stickerBuffer }, { quoted: msg });

    } catch (error) {
      console.error('sticker command error:', error.message);
      return extra.reply('❌ Sticker banate waqt error aya. Image/video format check karein.');
    } finally {
      if (inputPath && fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (outputPath && fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    }
  }
};
