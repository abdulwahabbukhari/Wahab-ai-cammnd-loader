const config = require('../../config');

module.exports = {
    name: 'getpp',
    aliases: ['dlpp', 'profilepic', 'getdp', 'pp'],
    category: 'general',
    description: 'Get user profile picture',
    usage: '.getpp [reply | @mention | number | me]',

    async execute(sock, msg, args, extra) {
        try {
            let target;
            let displayName = 'Unknown';
            let displayNumber = '';

            const text = args.join(' ').trim();

            // Quoted message info
            const quoted = msg.message?.extendedTextMessage?.contextInfo;

            // Replyed user
            if (quoted?.participant) {
                target = quoted.participant;
                if (quoted.pushName) displayName = quoted.pushName;
            }

            // Mentioned user
            else if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
                target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
            }

            // Me
            else if (text.toLowerCase() === "me") {
                target = extra.sender;
            }

            // Number
            else if (text) {
                const input = text.replace(/\D/g, '');

                if (input.length >= 10) {
                    target = `${input}@s.whatsapp.net`;
                    displayNumber = `+${input}`;
                } else {
                    return extra.reply(
                        "❌ *Invalid number!*\n\nExample:\n.getpp 923001234567"
                    );
                }
            }

            // No input
            else {
                return extra.reply(`📸 *Get Profile Picture*

*Usage:*
• Reply to someone's message:
.getpp

• Mention someone:
.getpp @user

• Enter a number:
.getpp 923001234567

• Get your own DP:
.getpp me`);
            }

            // Get name
            try {
                const contact = await sock.onWhatsApp(target);

                if (contact?.length) {
                    displayName =
                        contact[0].notify ||
                        contact[0].verifiedName ||
                        displayName;
                }
            } catch {}

            // Get profile picture
            let pp;

            try {
                pp = await sock.profilePictureUrl(target, 'image');
            } catch {
                return extra.reply(
                    `❌ No profile picture found for *${displayName}*`
                );
            }

            const caption = `📸 *Profile Picture*

👤 *Name:* ${displayName}
${displayNumber ? `📱 *Number:* ${displayNumber}\n` : ""}

🤖 *${config.botName}*`;

            const contextInfo = {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: config.channelId,
                    newsletterName: config.botName,
                    serverMessageId: 1
                }
            };

            await sock.sendMessage(
                extra.from,
                {
                    image: { url: pp },
                    caption,
                    mentions: [target],
                    contextInfo
                },
                { quoted: msg }
            );

        } catch (err) {
            console.error(err);
            extra.reply(`❌ Failed to fetch profile picture.\n${err.message}`);
        }
    }
};
