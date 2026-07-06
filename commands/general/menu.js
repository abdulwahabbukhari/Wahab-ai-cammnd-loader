const config = require('../../config');

module.exports = {
  name: 'menu',

  async execute(sock, msg, args, extra) {

    const text = `
╭─❀ *${config.botName}* ❀╮
│ 👋 Hey
│ 📂 Select Menu Type
╰────────────╯
`;

    const sections = [
      {
        title: "📋 MENU LIST",
        rows: [
          {
            title: "🧭 General Menu",
            rowId: ".menu_general",
            description: "Open general commands"
          },
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
          }
        ]
      }
    ];

    await sock.sendMessage(extra.from, {
      text,
      footer: "Bot Menu",
      buttonText: "📋 OPEN MENU",
      sections
    }, { quoted: msg });

  }
};
