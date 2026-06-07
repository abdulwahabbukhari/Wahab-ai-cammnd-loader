const os = require('os');
const fs = require('fs');
const config = require('../../config');

const getTotalMemory = () => {
    try {
        if (fs.existsSync('/sys/fs/cgroup/memory.max')) {
            const data = fs.readFileSync('/sys/fs/cgroup/memory.max', 'utf8').trim();
            if (data !== 'max') return Number(data);
        }
        if (fs.existsSync('/sys/fs/cgroup/memory/memory.limit_in_bytes')) {
            const data = fs.readFileSync('/sys/fs/cgroup/memory/memory.limit_in_bytes', 'utf8').trim();
            return Number(data);
        }
        return os.totalmem();
    } catch {
        return os.totalmem();
    }
};

module.exports = {
  name: 'ping',
  aliases: ['p'],
  category: 'general',
  description: 'Check bot latency and system performance',
  usage: '.ping',

  async execute(sock, msg, args, extra) {
    try {
      const start = Date.now();
      await sock.fetchStatus(extra.from);
      const messageLatency = Date.now() - start;
      
      const totalMemBytes = getTotalMemory();
      const usedMemBytes = process.memoryUsage().rss;

      const totalMem = (totalMemBytes / 1024 / 1024).toFixed(0);
      const usedMem = (usedMemBytes / 1024 / 1024).toFixed(0);

      const response = `⚡ *ᴍᴇꜱꜱᴀɢᴇ ʟᴀᴛᴇɴᴄʏ:* ${messageLatency} ms\n🧠 *ʀᴀᴍ ᴜꜱᴀɢᴇ:* ${usedMem}MB / ${totalMem}MB\n🧬 *ᴠᴇʀꜱɪᴏɴ:* ${config.version}`;

      const contextInfo = {
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
              newsletterJid: config.channelId,
              newsletterName: config.botName,
              serverMessageId: 1
          }
      };

      await sock.sendMessage(extra.from, { text: response.trim(), contextInfo }, { quoted: msg });
    } catch (error) {
      await extra.reply(`❌ *Ping Failed!*\n${error.message}`);
    }
  }
};
        
