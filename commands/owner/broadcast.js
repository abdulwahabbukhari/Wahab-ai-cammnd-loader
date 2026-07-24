module.exports = {
  name: 'broadcast',
  aliases: ['bcast', 'sendall'],
  category: 'owner',
  ownerOnly: true,
  description: 'Send a message to your WhatsApp contacts (limited count or all), rate-limited to reduce ban risk',
  usage: '.broadcast <message> <count|all>\n.broadcast Hello 5\n.broadcast Hello all',

  async execute(sock, msg, args, extra) {
    try {
      if (!args.length) {
        return extra.reply('❌ Message aur count/all dein!\n\nUsage:\n.broadcast Assalam-o-Alaikum 5\n.broadcast Assalam-o-Alaikum all');
      }

      // Last argument count (number) ya "all" hona chahiye
      const lastArg = args[args.length - 1].toLowerCase();
      let limit = null; // null = all
      let messageArgs = args;

      if (lastArg === 'all') {
        limit = null;
        messageArgs = args.slice(0, -1);
      } else if (/^\d+$/.test(lastArg)) {
        limit = parseInt(lastArg, 10);
        messageArgs = args.slice(0, -1);
      } else {
        return extra.reply('❌ Aakhir mein count (number) ya "all" dein!\n\nUsage:\n.broadcast Hello 5\n.broadcast Hello all');
      }

      const text = messageArgs.join(' ').trim();
      if (!text) {
        return extra.reply('❌ Message dein jo broadcast karna hai!\n\nUsage:\n.broadcast Hello 5\n.broadcast Hello all');
      }

      // Baileys store se contacts nikalna
      const contacts = sock.store?.contacts || {};
      let contactJids = Object.keys(contacts).filter(jid =>
        jid.endsWith('@s.whatsapp.net') && !jid.includes('@broadcast') && !jid.includes('@g.us')
      );

      if (contactJids.length === 0) {
        return extra.reply('❌ Koi contacts nahi mile. (Note: contacts store enable hona chahiye.)');
      }

      // Agar limit di gayi hai to sirf utne contacts lo
      if (limit !== null) {
        contactJids = contactJids.slice(0, limit);
      }

      await extra.reply(`📢 *Broadcast shuru ho raha hai...*\n\n👥 Total recipients: ${contactJids.length}\n⏱️ Estimated time: ~${Math.ceil(contactJids.length * 3 / 60)} minute(s)\n\n⚠️ Ban risk kam karne ke liye har message ke darmiyan delay diya ja raha hai.`);

      let sent = 0;
      let failed = 0;

      for (const jid of contactJids) {
        try {
          await sock.sendMessage(jid, {
            text: `📢 *Broadcast Message*\n\n${text}`
          });
          sent++;
        } catch (err) {
          failed++;
          console.error(`Broadcast failed for ${jid}:`, err.message);
        }

        // Rate-limit: har message ke darmiyan 3 second ka wait (ban risk kam karne ke liye)
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      return extra.reply(`✅ *Broadcast complete!*\n\n✅ Sent: ${sent}\n❌ Failed: ${failed}`);

    } catch (error) {
      console.error('broadcast command error:', error.message);
      return extra.reply('❌ Broadcast karte waqt error aya.');
    }
  }
};
