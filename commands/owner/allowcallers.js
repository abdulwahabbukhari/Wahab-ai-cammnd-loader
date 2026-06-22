const { loadData, saveData } = require('../../utils/anticallManager');
const config = require('../../config');

module.exports = {
  name: 'allowcallers',
  aliases: ['allowcall', 'whitelist'],
  category: 'owner',
  ownerOnly: true,
  description: 'Manage allowed callers for AntiCall feature',
  usage: '.allowcallers <add/remove/list> <number>',

  async execute(sock, msg, args, extra) {
    const data = loadData();
    if (!data.allowed) data.allowed = [];
    
    const prefix = config.prefix || '.';

    // 1. LIST COMMAND
    if (!args[0] || args[0].toLowerCase() === 'list') {
      let listText = `╭═✦〔 🛡️ *ᴀʟʟᴏᴡᴇᴅ ᴄᴀʟʟᴇʀꜱ* 〕✦═╮\n│\n`;

      if (data.allowed.length === 0) {
        listText += `│ ⚠️ No numbers whitelisted yet.\n`;
      } else {
        data.allowed.forEach((num, index) => {
          listText += `│ ${index + 1}. 📞 ${num}\n`;
        });
      }

      listText += `│\n│ *ᴄᴏᴍᴍᴀɴᴅꜱ*\n`;
      listText += `│ 🔹 \`${prefix}allowcallers add 923...\`\n`;
      listText += `│ 🔹 \`${prefix}allowcallers remove 923...\`\n`;
      listText += `╰═❀═══════════════❀═╯`;

      return extra.reply(listText);
    }

    const action = args[0].toLowerCase();

    if (!['add', 'remove'].includes(action)) {
        return extra.reply(`❌ Invalid action! Use \`${prefix}allowcallers add/remove/list\`.`);
    }

    if (!args[1]) {
        return extra.reply(`❌ Please provide a number with country code!\n\nExample: \`${prefix}allowcallers ${action} 923001234567\``);
    }

    let targetNumber = args[1].replace(/[^0-9]/g, '');

    // 2. ADD COMMAND
    if (action === 'add') {
        if (data.allowed.includes(targetNumber)) {
            return extra.reply(`⚠️ Number *${targetNumber}* is already in the whitelist.`);
        }

        data.allowed.push(targetNumber);
        saveData(data);
        return extra.reply(`✅ Successfully added *${targetNumber}* to the allowed callers list!`);
    }

    // 3. REMOVE COMMAND
    if (action === 'remove') {
        if (!data.allowed.includes(targetNumber)) {
            return extra.reply(`⚠️ Number *${targetNumber}* is not in the whitelist.`);
        }

        data.allowed = data.allowed.filter(num => num !== targetNumber);
        saveData(data);
        return extra.reply(`✅ Successfully removed *${targetNumber}* from the allowed callers list!`);
    }
  }
};
  
