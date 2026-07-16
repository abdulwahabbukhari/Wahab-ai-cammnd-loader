/**

* ViewOnce Command - Reveal view-once messages
  */
  const config = require('../../config');
  const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = {
name: 'vv',
aliases: ['readvo', 'read', 'viewonce'],
category: 'general',
description: 'Reveal view-once messages (images/videos/audio)',
usage: '.vv (reply to view-once message)',

async execute(sock, msg, args) {
try {
const chatId = msg.key.remoteJid;
const isGroup = chatId.endsWith('@g.us');

  // Try to get contextInfo from different message types
  const ctx = msg.message?.extendedTextMessage?.contextInfo
    || msg.message?.imageMessage?.contextInfo
    || msg.message?.videoMessage?.contextInfo
    || msg.message?.buttonsResponseMessage?.contextInfo
    || msg.message?.listResponseMessage?.contextInfo;

  if (!ctx?.quotedMessage || !ctx?.stanzaId) {
    return await sock.sendMessage(
      chatId,
      { text: '🗑️ Reply to a *view-once* message to reveal it.' },
      { quoted: msg }
    );
  }

  const quotedMsg = ctx.quotedMessage;

  // Check various patterns used for view-once messages
  const hasViewOnce =
    !!quotedMsg.viewOnceMessageV2 ||
    !!quotedMsg.viewOnceMessageV2Extension ||
    !!quotedMsg.viewOnceMessage ||
    !!quotedMsg.viewOnce ||
    !!quotedMsg?.imageMessage?.viewOnce ||
    !!quotedMsg?.videoMessage?.viewOnce ||
    !!quotedMsg?.audioMessage?.viewOnce;

  if (!hasViewOnce) {
    return await sock.sendMessage(
      chatId,
      { text: '🗑️ Reply to a *view-once* message to reveal it.' },
      { quoted: msg }
    );
  }

  // Extract the actual message content
  const actualMsg =
    quotedMsg.viewOnceMessageV2?.message ||
    quotedMsg.viewOnceMessageV2Extension?.message ||
    quotedMsg.viewOnceMessage?.message ||
    quotedMsg;

  const mtype = Object.keys(actualMsg)[0];

  // Helper to download media
  const downloadContent = async (message, type) => {
    const stream = await downloadContentFromMessage(message, type);

    let buffer = Buffer.from([]);

    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }

    return buffer;
  };

  const buffer = await downloadContent(
    actualMsg[mtype],
    mtype.replace('Message', '')
  );

  const originalCaption = actualMsg[mtype]?.caption || '';

  const cyberCaption = `╭━〔 CYBER REVEAL 〕━╮

│🔓 View-Once Unlocked!
│👁️ Secret Media Decrypted
│🤖 POWERED BY QADEER AI
╰═❀═════════════❀═╯

«Transmission intercepted successfully 🚀`;»

  const caption = originalCaption
    ? `${originalCaption}\n\n${cyberCaption}`
    : cyberCaption;

  if (/video/.test(mtype)) {
    await sock.sendMessage(
      chatId,
      {
        video: buffer,
        caption,
        mimetype: 'video/mp4'
      },
      { quoted: msg }
    );

  } else if (/image/.test(mtype)) {
    await sock.sendMessage(
      chatId,
      {
        image: buffer,
        caption,
        mimetype: 'image/jpeg'
      },
      { quoted: msg }
    );

  } else if (/audio/.test(mtype)) {
    await sock.sendMessage(
      chatId,
      {
        audio: buffer,
        ptt: true,
        mimetype: 'audio/ogg; codecs=opus'
      },
      { quoted: msg }
    );
  }

} catch (error) {
  console.error('Error in viewonce command:', error);

  await sock.sendMessage(
    msg.key.remoteJid,
    { text: '❌ Failed to reveal view-once message.' },
    { quoted: msg }
  );
}

}
};
