module.exports = {
  name: 'hack',
  aliases: ['hacker', 'prank'],
  category: 'owner',
  ownerOnly: false,
  description: 'Prank hack a mentioned or replied user with fake data',
  usage: '.hack @user or reply .hack',
  cooldown: 10,

  async execute(sock, msg, args, extra) {
    const { reply, from, isGroup } = extra;

    // 🎯 Target Detection
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
    const mentionedJid = contextInfo?.mentionedJid;
    const quotedSender = contextInfo?.participant;

    let target = null;

    if (mentionedJid && mentionedJid.length > 0) {
      target = mentionedJid[0];
    } else if (quotedSender) {
      target = quotedSender;
    } else {
      return reply(`❌ *Mention or reply to someone to hack them!*\n\n📌 *Usage:*\n.hack @user\n.hack (reply to message)`);
    }

    const targetName = target.split('@')[0];

    // 🎭 Fake Data Generators
    const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

    const cities = ['Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Ibadan', 'Accra', 'Nairobi', 'Cairo', 'Johannesburg', 'Kinshasa'];
    const emails = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com'];
    const devices = ['iPhone 14 Pro', 'Samsung Galaxy S23', 'Google Pixel 7', 'OnePlus 11', 'Xiaomi 13'];
    const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge', 'Opera'];

    // Generate random data
    const randomPhone = '+234' + Math.floor(Math.random() * 9000000000 + 1000000000);
    const randomEmail = `${targetName}@${pickRandom(emails)}`;
    const randomPassword = Math.random().toString(36).slice(2, 12);
    const randomCity = pickRandom(cities);
    const randomDevice = pickRandom(devices);
    const randomBrowser = pickRandom(browsers);
    const randomIP = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    const randomBalance = Math.floor(Math.random() * 9000000 + 1000000).toLocaleString();

    // 📜 Hack Stages
    const stages = [
      '🔍 *ɪɴɪᴛɪᴀʟɪᴢɪɴɢ ʜᴀᴄᴋ...*',
      '🌐 *ᴄᴏɴɴᴇᴄᴛɪɴɢ ᴛᴏ sᴇʀᴠᴇʀ...*',
      '🔓 *ʙʏᴘᴀssɪɴɢ ғɪʀᴇᴡᴀʟʟ...*',
      '💾 *ᴀᴄᴄᴇssɪɴɢ ᴅᴀᴛᴀʙᴀsᴇ...*',
      '🗂️ *ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ ғɪʟᴇs...*',
      '📡 *ʀᴇᴛʀɪᴇᴠɪɴɢ ɪɴғᴏʀᴍᴀᴛɪᴏɴ...*',
      '🔐 *ᴅᴇᴄʀʏᴘᴛɪɴɢ ᴅᴀᴛᴀ...*',
      '💻 *ᴀɴᴀʟʏᴢɪɴɢ sʏsᴛᴇᴍ...*'
    ];

    // 🎨 Final Hacked Data Card
    const finalMessage = `
╭━━〔 ☠️ *ʜᴀᴄᴋ ᴄᴏᴍᴘʟᴇᴛᴇ* ☠️ 〕━━┈⊷
┃
┃ ✅ *sʏsᴛᴇᴍ ʙʀᴇᴀᴄʜᴇᴅ!*
┃
┃ ╭─〔 📱 *ᴜsᴇʀ ᴅᴀᴛᴀ* 〕
┃ │
┃ │ 👤 *ɴᴀᴍᴇ:* @${targetName}
┃ │ 📞 *ᴘʜᴏɴᴇ:* ${randomPhone}
┃ │ 📧 *ᴇᴍᴀɪʟ:* ${randomEmail}
┃ │ 🔐 *ᴘᴀssᴡᴏʀᴅ:* ${randomPassword}
┃ │ 📍 *ʟᴏᴄᴀᴛɪᴏɴ:* ${randomCity}
┃ │ 🌐 *ɪᴘ ᴀᴅᴅʀᴇss:* ${randomIP}
┃ │ 📱 *ᴅᴇᴠɪᴄᴇ:* ${randomDevice}
┃ │ 🌍 *ʙʀᴏᴡsᴇʀ:* ${randomBrowser}
┃ │
┃ ╰────────────────
┃
┃ 💰 *ʙᴀɴᴋ ʙᴀʟᴀɴᴄᴇ:* ₦${randomBalance}
┃ 📸 *ɪɴsᴛᴀɢʀᴀᴍ:* @${targetName}
┃ 🐦 *ᴛᴡɪᴛᴛᴇʀ:* @${targetName}
┃ 📘 *ғᴀᴄᴇʙᴏᴏᴋ:* ${targetName}
┃
╰━━━━━━━━━━━━━━━┈⊷

*⚠️ ᴊᴜsᴛ ᴀ ᴘʀᴀɴᴋ ғᴏʀ ғᴜɴ! 😂*
*ɴᴏ ᴅᴀᴛᴀ ᴡᴀs ᴀᴄᴛᴜᴀʟʟʏ ʜᴀᴄᴋᴇᴅ*

> ᴘᴏᴡᴇʀᴇᴅ ʙʏ XENORIZE MD`;

    try {
      // 🚀 Send initial message
      let sentMsg = await sock.sendMessage(from, {
        text: stages[0],
        mentions: [target]
      }, { quoted: msg });

      // ⏳ Animate stages
      for (let i = 1; i < stages.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        try {
          // Try to edit message
          await sock.sendMessage(from, {
            text: stages[i],
            edit: sentMsg.key,
            mentions: [target]
          });
        } catch (editError) {
          // If edit fails, send new message
          sentMsg = await sock.sendMessage(from, {
            text: stages[i],
            mentions: [target]
          }, { quoted: msg });
        }
      }

      // 🎉 Final result
      await new Promise(resolve => setTimeout(resolve, 2000));
      await sock.sendMessage(from, {
        text: finalMessage,
        mentions: [target]
      }, { quoted: msg });

    } catch (error) {
      console.error('❌ Hack Error:', error.message);
      return reply('❌ *ғᴀɪʟᴇᴅ ᴛᴏ ᴇxᴇᴄᴜᴛᴇ ʜᴀᴄᴋ ᴄᴏᴍᴍᴀɴᴅ.*');
    }
  }
};
