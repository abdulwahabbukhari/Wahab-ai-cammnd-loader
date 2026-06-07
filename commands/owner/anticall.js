const { loadData, saveData } = require('../../utils/anticallManager');

module.exports = {
  name: 'anticall',
  category: 'owner',
  ownerOnly: true,
  description: 'Enable or disable anti-call system',

  async execute(sock, msg, args, extra) {
    const data = loadData();

    if (!args[0]) {
      return extra.reply(`⚙️ *ᴀ.ᴄ ꜱᴇᴛᴛɪɴɢꜱ*\nStatus: ${data.enabled ? 'ON ✅' : 'OFF ❌'}\n\nUsage:\n.anticall on\n.anticall off`);
    }

    const option = args[0].toLowerCase();

    if (option === 'on') {
      data.enabled = true;
      saveData(data);
      return extra.reply('✅ Anti-call enabled. Callers will be blocked after 3 warnings.');
    }

    if (option === 'off') {
      data.enabled = false;
      saveData(data);
      return extra.reply('❌ Anti-call disabled.');
    }

    return extra.reply('❌ Invalid option! Use on or off.');
  }
};
    
