const config = require('../../config');

module.exports = {
    name: 'time',
    aliases: ['clock', 'date'],
    category: 'general',
    description: 'Show current time and date',
    usage: '.time',

    async execute(sock, msg, args, extra) {

        const now = new Date();

        const time = now.toLocaleTimeString('en-PK', {
            timeZone: 'Asia/Karachi',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });

        const date = now.toLocaleDateString('en-GB', {
            timeZone: 'Asia/Karachi',
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });

        const day = now.toLocaleDateString('en-US', {
            timeZone: 'Asia/Karachi',
            weekday: 'long'
        });

        const response = `
╭━━━〔 ⏰ TIME & DATE 〕━━━╮
┃ 🕒 Time : ${time}
┃ 📅 Date : ${date}
┃ 📆 Day  : ${day}
┃ 🌍 Zone : Asia/Karachi
╰━━━━━━━━━━━━━━━━━━╯

『 💎 WAHAB AI OFFICIAL 💎 』
`;

        await sock.sendMessage(
            extra.from,
            { text: response.trim() },
            { quoted: msg }
        );
    }
};