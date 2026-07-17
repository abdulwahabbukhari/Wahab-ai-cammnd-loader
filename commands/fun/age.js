module.exports = {
    name: 'age',
    aliases: ['agecalc', 'dob', 'myage', 'calculateage'],
    category: 'tools',
    description: 'Calculate age from date of birth',

    async execute(sock, msg, args, extra) {

        if (!args.length) {
            return extra.reply(
                '❌ *Please enter your Date of Birth!*\n\n' +
                '📌 Example:\n' +
                '`.age 15/08/2008`'
            );
        }

        const input = args[0].replace(/-/g, '/');
        const parts = input.split('/');

        if (parts.length !== 3) {
            return extra.reply('❌ Invalid format!\n\nUse: `.age DD/MM/YYYY`');
        }

        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const year = parseInt(parts[2]);

        const dob = new Date(year, month, day);

        if (isNaN(dob.getTime())) {
            return extra.reply('❌ Invalid Date of Birth!');
        }

        const now = new Date();

        let years = now.getFullYear() - dob.getFullYear();
        let months = now.getMonth() - dob.getMonth();
        let days = now.getDate() - dob.getDate();

        if (days < 0) {
            months--;
            const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
            days += prevMonth.getDate();
        }

        if (months < 0) {
            years--;
            months += 12;
        }

        const diff = now - dob;

        const weeks = Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
        const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor(diff / (1000 * 60));
        const seconds = Math.floor(diff / 1000);

        const totalMonths = years * 12 + months;

        const text = `
╔══════════════════════╗
      🎂 AGE REPORT
╚══════════════════════╝

👤 DOB      : ${input}

🎉 Years    : ${years}
🗓️ Months   : ${totalMonths}
📅 Weeks    : ${weeks}
🌞 Days     : ${totalDays}
⏳ Hours    : ${hours}
⏰ Minutes  : ${minutes}
⚡ Seconds  : ${seconds}

━━━━━━━━━━━━━━━━━━
✨ Current Age
${years} Years, ${months} Months, ${days} Days
━━━━━━━━━━━━━━━━━━`;

        await extra.reply(text.trim());
    }
};
