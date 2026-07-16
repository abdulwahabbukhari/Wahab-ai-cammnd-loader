module.exports = {
  name: 'getpp',
  aliases: ['getdp', 'pp', 'dp'],
  category: 'general',
  description: 'Get user or group profile picture',
  usage: '.getpp 923xxxxxxxxx OR .getpp group link',

  async execute(sock, msg, args, { from, reply }) {
    try {
      // Check if user provided a number or link
      if (args.length === 0) {
        return reply(
          '❌ Example:\n\n.getpp 923001234567\n\nOR\n\n.getpp https://chat.whatsapp.com/xxxxxxxx'
        );
      }

      const q = args.join(' ');
      let targetJid;

      // =========================
      // GROUP LINK HANDLING
      // =========================
      if (q.includes("chat.whatsapp.com/")) {
        const code = q.split("https://chat.whatsapp.com/")[1]?.trim();

        if (!code) {
          return reply("❌ Invalid group link.");
        }

        try {
          // Fetch group info using the invite code
          const groupInfo = await sock.groupGetInviteInfo(code);

          if (!groupInfo?.id) {
            return reply("❌ Group not found.");
          }
          targetJid = groupInfo.id;
          
        } catch (error) {
          return reply("❌ Failed to get group info. Link might be revoked or invalid.");
        }
      }

      // =========================
      // PHONE NUMBER HANDLING
      // =========================
      else {
        // Clean the number (remove spaces, +, etc)
        let number = q.replace(/[^0-9]/g, "");

        if (number.length < 10 || number.length > 15) {
          return reply("❌ Invalid number. Please provide a valid phone number.");
        }

        targetJid = `${number}@s.whatsapp.net`;
      }

      // =========================
      // GET PROFILE PHOTO
      // =========================
      let pp;
      try {
        // Fetch the high-quality image URL
        pp = await sock.profilePictureUrl(targetJid, "image");
      } catch {
        return reply("❌ Profile picture not found. (User may have hidden it or doesn't have one).");
      }

      // =========================
      // SEND IMAGE
      // =========================
      await sock.sendMessage(
        from,
        {
          image: { url: pp },
          caption: `╭━━〔 *PROFILE PICTURE* 〕━━┈⊷\n┃\n┃◈ • 🆔 ${targetJid}\n┃◈ • ✅ Profile fetched successfully\n┃\n╰──────────────┈⊷\n> 🤖 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚀𝙰𝙳𝙴𝙴𝚁 𝙰𝙸`
        },
        { quoted: msg }
      );

    } catch (err) {
      console.error("GETPP CMD ERROR:", err.message);
      return reply("❌ Failed to fetch profile picture due to an unexpected error.");
    }
  }
};
