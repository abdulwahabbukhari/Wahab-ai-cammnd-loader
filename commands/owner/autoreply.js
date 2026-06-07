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
  } catch (err) {
    console.error(`Error updating config:`, err);
  }
}

module.exports = {
  name: 'chatbot',
  aliases: ['autoreply'],
  category: 'owner',
  ownerOnly: true,
  description: 'Enable or disable AI Auto-Reply',

  async execute(sock, msg, args, extra) {
    if (!args[0]) {
      return extra.reply(`🤖 *ᴀ.ɪ ᴀᴜᴛᴏ-ʀᴇᴘʟʏ*\nStatus: ${config.autoReply ? 'ON ✅' : 'OFF ❌'}\n\nUsage:\n.autoreply on\n.autoreply off`);
    }

    const option = args[0].toLowerCase();

    if (option === 'on') {
      updateConfig('autoReply', true);
      config.autoReply = true;
      return extra.reply('✅ *AI Auto-Reply ENABLED!*\nBot will reply to private messages.');
    }

    if (option === 'off') {
      updateConfig('autoReply', false);
      config.autoReply = false;
      return extra.reply('❌ *AI Auto-Reply DISABLED!*');
    }

    return extra.reply('❌ Invalid option! Use on or off.');
  }
};
            
