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
  name: 'antidelete',
  aliases: ['antidel'],
  category: 'owner',
  ownerOnly: true,
  description: 'Enable or disable Anti-Delete (forwards deleted text/media to your own DM)',

  async execute(sock, msg, args, extra) {
    if (!args[0]) {
      return extra.reply(
        `🗑️ *ᴀɴᴛɪ-ᴅᴇʟᴇᴛᴇ*\nStatus: ${config.antiDelete ? 'ON ✅' : 'OFF ❌'}\n\nUsage:\n.antidelete on\n.antidelete off`
      );
    }

    const option = args[0].toLowerCase();

    if (option === 'on') {
      updateConfig('antiDelete', true);
      config.antiDelete = true;
      return extra.reply('✅ *Anti-Delete ENABLED!*\nDeleted messages (text/image/video/sticker) will be forwarded to your own DM.');
    }

    if (option === 'off') {
      updateConfig('antiDelete', false);
      config.antiDelete = false;
      return extra.reply('❌ *Anti-Delete DISABLED!*');
    }

    return extra.reply('❌ Invalid option! Use on or off.');
  }
};
