const config = require('../../config');

module.exports = {
    name: 'menu',

    async execute(sock, msg, args, extra) {

        const text = `
╭─❀ *${config.botName}* ❀╮
│ 👋 Hey
│ 📂 Choose Menu Type
╰────────────╯
`;

        const sections = [
            {
                title: "📋 MAIN MENUS",
                rows: [
                    {
                        title: "🤖 AI Menu",
                        rowId: ".menu_ai",
                        description: "Open AI commands"
                    },
                    {
                        title: "🎭 Fun Menu",
                        rowId: ".menu_fun",
                        description: "Open fun commands"
                    },
                    {
                        title: "⬇️ Download Menu",
                        rowId: ".menu_download",
                        description: "Open download tools"
                    },
                    {
                        title: "🧭 General Menu",
                        rowId: ".menu_general",
                        description: "Open general commands"
                    }
                ]
            }
        ];

        await sock.sendMessage(extra.from, {
            text,
            footer: "Bot Menu System",
            buttonText: "📋 OPEN MENU",
            sections
        }, { quoted: msg });
    }
};
