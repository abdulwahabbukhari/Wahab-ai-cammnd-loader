const { normalizeJid, resolveLidToPn, extractNumber } = require('../../utils/jidHelper');

module.exports = {
  name: 'getpp',
  aliases: ['pp', 'ppic'],
  category: 'owner',
  ownerOnly: true,
  description: 'Get profile picture of a mentioned/replied/number-given user',
  usage: '.getpp (mention/reply) or .getpp 923001234567',

  async execute(sock, msg, args, extra) {
    try {
      const contextInfo = msg.message?.extendedTextMessage?.contextInfo;

      // 1. Mention se target nikaalna
      let targetJid = contextInfo?.mentionedJid?.[0];

      // 2. Reply se target nikaalna (agar mention nahi mila)
      if (!targetJid && contextInfo?.participant) {
        targetJid = contextInfo.participant;
      }

      // 3. Argument mein number diya ho (fallback)
      if (!targetJid && args[0]) {
        const num = args[0].replace(/[^0-9]/g, '');
        if (num) targetJid = `${num}@s.whatsapp.net`;
      }

      console.log(`[📸 GETPP DEBUG] mentionedJid: ${JSON.stringify(contextInfo?.mentionedJid)} | participant: ${contextInfo?.participant} | args: ${JSON.stringify(args)}`);

      if (!targetJid) {
        return extra.reply(
          '❌ Kisi ko mention karein, unke message ko reply karein, ya number dein!\n\nUsage:\n.getpp @user\n.getpp (reply to someone)\n.getpp 923001234567'
        );
      }

      // LID format ho to resolve karo asal number mein
      if (targetJid.includes('@lid')) {
        console.log(`[📸 GETPP DEBUG] Resolving LID: ${targetJid}`);
        targetJid = await resolveLidToPn(sock, targetJid);
        console.log(`[📸 GETPP DEBUG] Resolved to: ${targetJid}`);
      }
      targetJid = normalizeJid(targetJid);
      console.log(`[📸 GETPP DEBUG] Final targetJid: ${targetJid}`);

      let ppUrl;
      try {
        console.log(`[📸 GETPP DEBUG] Calling profilePictureUrl for: ${targetJid}`);
        ppUrl = await sock.profilePictureUrl(targetJid, 'image');
        console.log(`[📸 GETPP DEBUG] Got URL (image): ${ppUrl}`);
      } catch (err) {
        console.log(`[📸 GETPP DEBUG] 'image' fetch ERROR: ${err.message}`);
      }

      // Agar high-res 'image' na mile ya undefined aaye, 'preview' try karo
      if (!ppUrl) {
        try {
          ppUrl = await sock.profilePictureUrl(targetJid, 'preview');
          console.log(`[📸 GETPP DEBUG] Got URL (preview): ${ppUrl}`);
        } catch (err) {
          console.log(`[📸 GETPP DEBUG] 'preview' fetch ERROR: ${err.message}`);
        }
      }

      if (!ppUrl) {
        return extra.reply(`❌ Profile picture nahi mili. Ho sakta hai user ki DP private ho ya set na ho.\n\n📞 Number: ${extractNumber(targetJid)}`);
      }

      await sock.sendMessage(
        extra.from,
        {
          image: { url: ppUrl },
          caption: `📸 *Profile Picture*\n📞 Number: ${extractNumber(targetJid)}`
        },
        { quoted: msg }
      );
    } catch (error) {
      console.error('getpp command error:', error);
      return extra.reply('❌ Kuch masla ho gaya profile picture fetch karte waqt.');
    }
  }
};
