const fs = require('fs');
const path = require('path');
const config = require('../../config');

function updateAllowedCallersFile(newArray) {
  const configPath = path.join(__dirname, '../../config.js');
  try {
    let configData = fs.readFileSync(configPath, 'utf8');
    const regex = /(allowedCallers:\s*\[)([^\]]*)(\])/;
    const arrayString = newArray.map(num => `'${num}'`).join(', ');

    if (regex.test(configData)) {
        configData = configData.replace(regex, `$1${arrayString}$3`);
        fs.writeFileSync(configPath, configData, 'utf8');
        return true;
    }
    return false;
  } catch (err) {
    return false;
  }
}

module.exports = {
  name: 'allowcallers',
  aliases: ['allowcall', 'whitelist'],
  category: 'owner',
  ownerOnly: true,
  description: 'Manage allowed callers for AntiCall feature',
  usage: '.allowcallers <add/remove/list> <number>',

  async execute(sock, msg, args, extra) {
    if (!config.allowedCallers) config.allowedCallers = [];
    
    const prefix = config.prefix || '.';

    if (!args[0] || args[0].toLowerCase() === 'list') {
      let listText = `╭═✦〔 🛡️ *ᴀʟʟᴏᴡᴇᴅ ᴄᴀʟʟᴇʀꜱ* 〕✦═╮\n│\n`;

      if (config.allowedCallers.length === 0) {
        listText += `│ ⚠️ No numbers whitelisted yet.\n`;
      } else {
        config.allowedCallers.forEach((num, index) => {
          listText += `│ ${index + 1}. 📞 ${num}\n`;
        });
      }

      listText += `│\n│ *ᴄᴏᴍᴍᴀɴᴅꜱ*\n`;
      listText += `│ 🔹 \`${prefix}allowcallers add 923...\`\n`;
      listText += `│ 🔹 \`${prefix}allowcallers remove 923...\`\n`;
      listText += `╰═❀═════════════❀═╯`;

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

    if (action === 'add') {
        if (config.allowedCallers.includes(targetNumber)) {
            return extra.reply(`⚠️ Number *${targetNumber}* is already in the whitelist.`);
        }

        config.allowedCallers.push(targetNumber);
        if (updateAllowedCallersFile(config.allowedCallers)) {
            return extra.reply(`✅ Successfully added *${targetNumber}* to the allowed callers list!`);
        } else {
            config.allowedCallers = config.allowedCallers.filter(num => num !== targetNumber);
            return extra.reply(`❌ Failed to save number to config.js file.`);
        }
    }

    if (action === 'remove') {
        if (!config.allowedCallers.includes(targetNumber)) {
            return extra.reply(`⚠️ Number *${targetNumber}* is not in the whitelist.`);
        }

        config.allowedCallers = config.allowedCallers.filter(num => num !== targetNumber);
        if (updateAllowedCallersFile(config.allowedCallers)) {
            return extra.reply(`✅ Successfully removed *${targetNumber}* from the allowed callers list!`);
        } else {
            config.allowedCallers.push(targetNumber);
            return extra.reply(`❌ Failed to update config.js file.`);
        }
    }
  }
};
  
