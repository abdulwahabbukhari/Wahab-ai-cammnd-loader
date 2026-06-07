module.exports = {
    name: 'friend',
    aliases: ['friends'],
    category: 'fun',
    description: 'Show my friends list',

    async execute(sock, msg, args, extra) {

        const friends = [
            'MUZAMIL',
            'ABBAS',
            'ZAHID',
            'ABDUL MALIK',
            'KUMAIL',
            'QADEER KHAN'
        ];

        let text = '👥 *MY FRIENDS LIST*\n\n';

        friends.forEach((name, index) => {
            text += `${index + 1}. ${name}\n`;
        });

        text += `\n✨ Total Friends: ${friends.length}`;

        await extra.reply(text);
    }
};