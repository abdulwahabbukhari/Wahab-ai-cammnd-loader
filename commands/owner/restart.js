const { exec } = require('child_process');

module.exports = {
  name: 'restart',
  aliases: ['reboot', 'reload'],
  category: 'owner',
  description: 'Restart the bot',
  ownerOnly: true,

  async execute(sock, msg, args, extra) {
    try {
      await extra.reply('🔁 Restarting bot...');
      try {
        exec('pm2 restart all');
        return;
      } catch (e) {}

      setTimeout(() => { process.exit(0); }, 500);
    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  }
};
