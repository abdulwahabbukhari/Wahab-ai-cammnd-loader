const config = require('../../config');
const { loadCommands } = require('../../utils/commandLoader');

module.exports = {
    name: 'menu',
    aliases: ['help', 'commands'],
    category: 'general',

    async execute(sock, msg, args, extra) {
        try {

            const commands = loadCommands();
            const categories = {};

            // group commands
            commands.forEach((cmd, name) => {
                const cat = cmd.category || 'general';
                if (!categories[cat]) categories[cat] = [];
                categories[cat].push(cmd.name);
            });

            const user = extra.sender.split('@')[0];

            // 📌 MAIN TEXT
            const text = `
╭─❀ *${config.botName}* ❀╮
│ 👋 Hey @${user}
│ 📦 Commands: ${commands.size}
│ 🚀 Prefix: ${config.prefix}
╰────────────╯

👉 Select a category below
            `;

            // 📋 LIST MENU (MAIN PART)
            const sections = [];

            Object.keys(categories).forEach(cat => {
                sections.push({
                    title: `📂 ${cat.toUpperCase()} MENU`,
                    rows: [
                        {
                            title: `Open ${cat} Commands`,
                            rowId: `${config.prefix}open_${cat}`,
                            description: `View all ${cat} commands`
                        }
                    ]
                });
            });

            const listMessage = {
                text,
                footer: "⚡ Powered by Bot",
                buttonText: "📋 OPEN MENU",
                sections
            };

            await sock.sendMessage(extra.from, listMessage, { quoted: msg });

        } catch (err) {
            console.error(err);
            await extra.reply("❌ Menu Error");
        }
    }
};
