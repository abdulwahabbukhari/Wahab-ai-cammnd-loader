const config = require('../../config');
const { loadCommands } = require('../../utils/commandLoader');
const fs = require('fs');
const os = require('os');
const path = require('path');

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

const CATEGORY_META = {
    general:    { emoji: '🧭', label: 'General Commands' },
    ai:         { emoji: '🤖', label: 'AI Commands' },
    whatsapp:   { emoji: '💚', label: 'WhatsApp Commands' },
    group:      { emoji: '🔵', label: 'Group Commands' },
    admin:      { emoji: '🛡️', label: 'Admin Commands' },
    owner:      { emoji: '👑', label: 'Owner Commands' },
    media:      { emoji: '🎞️', label: 'Media Commands' },
    fun:        { emoji: '🎭', label: 'Fun Commands' },
    utility:    { emoji: '🔧', label: 'Utility Commands' },
    search:     { emoji: '🔎', label: 'Search Commands' },
    textmaker:  { emoji: '🖋️', label: 'Textmaker Commands' },
    download:   { emoji: '⬇️', label: 'Download Commands' },
};

const CATEGORY_ORDER = [
    'general', 'ai', 'whatsapp', 'group', 'admin',
    'owner', 'media', 'fun', 'utility', 'search',
    'textmaker', 'download'
];

module.exports = {
    name: 'menu',
    aliases: ['help', 'commands'],
    category: 'general',
    description: 'Show all available commands',
    usage: '.menu',

    async execute(sock, msg, args, extra) {
        try {
            const commands = loadCommands();
            const categories = {};

            commands.forEach((cmd, name) => {
                if (cmd.name === name) {
                    const cat = cmd.category || 'general';
                    if (!categories[cat]) categories[cat] = [];
                    categories[cat].push(cmd);
                }
            });

            Object.keys(categories).forEach(cat => {
                categories[cat].sort((a, b) => a.name.localeCompare(b.name));
            });

            const ownerName = Array.isArray(config.ownerName)
                ? config.ownerName[0]
                : config.ownerName;

            const user = extra.sender.split('@')[0];

            const totalMemBytes = getTotalMemory();
            const usedMemBytes = process.memoryUsage().rss;
            const totalMem = (totalMemBytes / 1024 / 1024).toFixed(0);
            const usedMem = (usedMemBytes / 1024 / 1024).toFixed(0);
            const freeMem = (totalMem - usedMem).toFixed(0);

            let menuText = `╭─❀ *${config.botName}* ❀╮\n`;
            menuText += `│ 👋 Hey @${user}\n`;
            menuText += `│ 🌸 Prefix: ${config.prefix}\n`;
            menuText += `│ 🚀 Version: ${config.version}\n`;
            menuText += `│ 📦 Commands: ${commands.size}\n`;
            menuText += `│ 👑 Owner: ${ownerName}\n`;
            menuText += `│ 🧠 RAM: ${usedMem}MB / ${totalMem}MB\n`;
            menuText += `╰─────────────╯\n`;

            const allCats = [
                ...CATEGORY_ORDER.filter(c => categories[c]),
                ...Object.keys(categories).filter(c => !CATEGORY_ORDER.includes(c))
            ];

            for (const cat of allCats) {
                if (!categories[cat] || categories[cat].length === 0) continue;

                const meta = CATEGORY_META[cat] || {
                    emoji: '📁',
                    label: cat.charAt(0).toUpperCase() + cat.slice(1) + ' Commands'
                };

                menuText += `╭─${meta.emoji} *${meta.label}* ${meta.emoji}╮\n`;
                categories[cat].forEach(cmd => {
                    menuText += `│ ✦ ${config.prefix}${cmd.name}\n`;
                });
                menuText += `╰───────────────╯\n`;
            }

            const contextInfo = {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: config.channelId,
                    newsletterName: config.botName,
                    serverMessageId: 1
                }
            };

            const imagePath = path.join(__dirname, '../../utils/bot_image.jpg');

            if (fs.existsSync(imagePath)) {
                const imageBuffer = fs.readFileSync(imagePath);
                await sock.sendMessage(
                    extra.from,
                    {
                        image: imageBuffer,
                        caption: menuText,
                        mentions: [extra.sender],
                        contextInfo
                    },
                    { quoted: msg }
                );
            } else {
                await sock.sendMessage(
                    extra.from,
                    {
                        text: menuText,
                        mentions: [extra.sender],
                        contextInfo
                    },
                    { quoted: msg }
                );
            }

        } catch (err) {
            console.error('Menu error:', err);
            await extra.reply(`❌ Menu Error:\n${err.message}`);
        }
    },
};
  
