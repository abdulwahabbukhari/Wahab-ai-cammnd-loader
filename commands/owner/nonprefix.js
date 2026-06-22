/**
 * No-Prefix Command - Toggle prefix requirement for commands (Simple Version for SYED MD)
 */

const fs = require('fs');
const path = require('path');
const config = require('../../config');

function updateConfigBoolean(setting, value) {
  const configPath = path.join(__dirname, '../../config.js');
  try {
    let configData = fs.readFileSync(configPath, 'utf8');
    // Regex to find the setting and change its boolean value
    const regex = new RegExp(`(${setting}:\\s*)(true|false)`);
    if (regex.test(configData)) {
        configData = configData.replace(regex, `$1${value}`);
        fs.writeFileSync(configPath, configData, 'utf8');
    } else {
        console.log(`[SYED MD] ${setting} not found in config.js to replace.`);
    }
  } catch (err) {
    console.error(`[SYED MD] Error updating ${setting} in config.js:`, err);
  }
}

module.exports = {
  name: 'noprefix',
  aliases: ['withoutprefix', 'toggleprefix'],
  category: 'owner',
  ownerOnly: true,
  description: 'Enable or disable bot working without a prefix',
  usage: '.noprefix on/off/status',

  async execute(sock, msg, args, extra) {
    const currentStatus = config.noprefix || false;
    const from = extra.from;

    if (!args[0]) {
      let textMenu = 
        `╭═✦〔 ⚙️ *ɴᴏ-ᴘʀᴇꜰɪx ᴍᴏᴅᴇ* 〕✦═╮\n│\n` +
        `│🚀 Status: *${currentStatus ? 'ON ✅' : 'OFF ❌'}*\n│\n` +
        `│ *ᴄᴏᴍᴍᴀɴᴅꜱ*\n` +
        `│ 🔹 \`.noprefix on\`  -> Bot works without prefix\n` +
        `│ 🔹 \`.noprefix off\` -> Bot requires prefix\n` +
        `│ 🔹 \`.noprefix status\` -> Check current status\n` +
        `╰═❀═════════════❀═╯`;
      
      // Simple text message without any Meta AI verification labels
      return sock.sendMessage(from, { text: textMenu }, { quoted: msg });
    }

    const option = args[0].toLowerCase().trim();

    if (option === 'status') {
      return extra.reply(`🚀 No-Prefix Mode is currently: *${currentStatus ? 'ON ✅' : 'OFF ❌'}*`);
    }

    if (option === 'on') {
      updateConfigBoolean('noprefix', true);
      config.noprefix = true; // Live update cache
      return extra.reply('✅ *No-Prefix Mode is ON!*\n\nUsers can now trigger commands without typing the prefix (e.g., just type `menu` instead of `.menu`).');
    }

    if (option === 'off') {
      updateConfigBoolean('noprefix', false);
      config.noprefix = false; // Live update cache
      return extra.reply('❌ *No-Prefix Mode is OFF!*\n\nBot will strictly require the prefix to execute commands.');
    }

    return extra.reply('❌ Invalid option! Use `.noprefix on`, `.noprefix off`, or `.noprefix status`.');
  }
};
                       
