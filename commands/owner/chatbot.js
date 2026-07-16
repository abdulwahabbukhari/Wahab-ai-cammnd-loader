const config = require('../../config');
const fs = require('fs');
const path = require('path');

function updateConfig(setting, value) {
  const configPath = path.join(__dirname, '../../config.js');
  try {
    let configData = fs.readFileSync(configPath, 'utf8');
    const regex = new RegExp(`(${setting}:\\s*)(true|false)`);
    configData = configData.replace(regex, `$1${value}`);
    fs.writeFileSync(configPath, configData, 'utf8');
    return true;
  } catch (err) {
    console.error(`Error updating config:`, err);
    return false;
  }
}

module.exports = {
  name: 'chatbot',
  aliases: ['autoreply'],
  category: 'owner',
  ownerOnly: true,
  description: 'Enable or disable AI Auto-Reply (text + voice) separately for DMs and Groups',

  async execute(sock, msg, args, extra) {
    if (!args[0] || !args[1]) {
      return extra.reply(
        `🤖 *ᴀ.ɪ ᴀᴜᴛᴏ-ʀᴇᴘʟʏ*\n\n` +
        `DM Status: ${config.autoReplyDM ? 'ON ✅' : 'OFF ❌'}\n` +
        `Group Status: ${config.autoReplyGroup ? 'ON ✅' : 'OFF ❌'}\n\n` +
        `(Text aur Voice dono is se control hote hain — koi alag command nahi)\n\n` +
        `Usage:\n` +
        `.chatbot on dms\n` +
        `.chatbot off dms\n` +
        `.chatbot on gc\n` +
        `.chatbot off gc`
      );
    }

    const option = args[0].toLowerCase();
    const target = args[1].toLowerCase();

    if (option !== 'on' && option !== 'off') {
      return extra.reply('❌ Invalid option! Use on or off.');
    }

    if (target !== 'dms' && target !== 'gc') {
      return extra.reply('❌ Invalid target! Use dms or gc.');
    }

    const value = option === 'on';

    if (target === 'dms') {
      // Ek hi command se text-chatbot aur voice-chatbot dono DM ke liye control hote hain
      updateConfig('autoReplyDM', value);
      updateConfig('voiceChatbotDM', value);
      config.autoReplyDM = value;
      config.voiceChatbotDM = value;
      return extra.reply(
        value
          ? '✅ *AI Auto-Reply ENABLED for DMs!*\nText message → text reply.\nVoice note → voice reply.'
          : '❌ *AI Auto-Reply DISABLED for DMs!*'
      );
    }

    if (target === 'gc') {
      // Ek hi command se text-chatbot aur voice-chatbot dono Group ke liye control hote hain
      updateConfig('autoReplyGroup', value);
      updateConfig('voiceChatbotGroup', value);
      config.autoReplyGroup = value;
      config.voiceChatbotGroup = value;
      return extra.reply(
        value
          ? '✅ *AI Auto-Reply ENABLED for Groups!*\nMention/reply karne par:\nText message → text reply.\nVoice note → voice reply.'
          : '❌ *AI Auto-Reply DISABLED for Groups!*'
      );
    }
  }
};
