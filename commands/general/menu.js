const config = require('../../config');
const { loadCommands } = require('../../utils/commandLoader');
const fs = require('fs');
const os = require('os');
const path = require('path');

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

            // Group commands by category
            commands.forEach((cmd, name) => {
                if (cmd.name === name) {
                    const cat = cmd.category || 'general';
                    if (!categories[cat]) categories[cat] = [];
                    categories[cat].push(cmd);
                }
            });

            // Sort commands
            Object.keys(categories).forEach(cat => {
                categories[cat].sort((a, b) => a.name.localeCompare(b.name));
            });

            const user = extra.sender.split('@')[0];

            // Build menu text
            let menuText = `╭─❀ *${config.botName}* ❀╮\n`;
            menuText += `│ 👋 Hey @${user}\n`;
            menuText += `│ 🌸 Prefix: ${config.prefix}\n`;
            menuText += `│ 🚀 Version: ${config.version}\n`;
            menuText += `│ 📦 Commands: ${commands.size}\n`;
            menuText += `╰─────────────╯\n\n`;

            const CATEGORY_ORDER = [
                'general', 'ai', 'whatsapp', 'group', 'admin',
                'owner', 'media', 'fun', 'utility', 'search',
                'textmaker', 'download'
            ];

            const CATEGORY_META = {
                general: "🧭 General",
                ai: "🤖 AI",
                whatsapp: "💚 WhatsApp",
                group: "🔵 Group",
                admin: "🛡️ Admin",
                owner: "👑 Owner",
                media: "🎞️ Media",
                fun: "🎭 Fun",
                utility: "🔧 Utility",
                search: "🔎 Search",
                textmaker: "🖋️ Textmaker",
                download: "⬇️ Download"
            };

            const allCats = [
                ...CATEGORY_ORDER.filter(c => categories[c]),
                ...Object.keys(categories).filter(c => !CATEGORY_ORDER.includes(c))
            ];

            for (const cat of allCats) {
                if (!categories[cat]) continue;

                menuText += `\n╭─ ${CATEGORY_META[cat] || cat.toUpperCase()} ─╮\n`;
                categories[cat].forEach(cmd => {
                    menuText += `│ ✦ ${config.prefix}${cmd.name}\n`;
                });
                menuText += `╰─────────────╯\n`;
            }

            // BUTTONS (MAIN FIX 🔥)
            const buttons = [
                { buttonId: `${config.prefix}menu`, buttonText: { displayText: "📋 MENU REFRESH" }, type: 1 },
                { buttonId: `${config.prefix}vid pasoori`, buttonText: { displayText: "🎬 TEST VIDEO" }, type: 1 },
                { buttonId: `${config.prefix}ping`, buttonText: { displayText: "📡 PING" }, type: 1 }
            ];

            const imagePath = path.join(__dirname, '../../utils/bot_image.jpg');

            const messageData = {
                caption: menuText,
                mentions: [extra.sender],
                buttons: buttons,
                headerType: 4,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: config.channelId,
                        newsletterName: config.botName,
                        serverMessageId: 1
                    }
                }
            };

            if (fs.existsSync(imagePath)) {
                messageData.image = fs.readFileSync(imagePath);
            } else {
                messageData.text = menuText;
            }

            await sock.sendMessage(extra.from, messageData, { quoted: msg });

        } catch (err) {
            console.error('Menu error:', err);
            await extra.reply(`❌ Menu Error:\n${err.message}`);
        }
    },
};
