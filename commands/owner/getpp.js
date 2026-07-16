/**
 * Get Profile Picture Command
 * Independent setup for Baileys JID and messaging
 */

module.exports = {
  name: 'getpp',
  aliases: ['getdp', 'dp'],
  category: 'general',
  description: 'Get user or group profile picture',
  usage: '.getpp 923xxxxxxxxx OR .getpp group link',

  async execute(sock, msg, args) {
    // 1. Khud apna 'from' aur 'reply' function set kar rahy hain
    // Taky handler par depend na karna paray aur 'toString' wala error na aaye
    const from = msg.key.remoteJid;
    
    const reply = async (text) => {
      return await sock.sendMessage(from, { text: text }, { quoted: msg });
    };

    try {
      if (!args || args.length === 0) {
        return await reply('❌ Example:\n\n.getpp 923001234567\n\nOR\n\n.getpp https://chat.whatsapp.com/xxxxxxxx');
      }

      const q = args.join(' ');
      let targetJid = ''; // Hum isko khud theek format main layengy

      // =========================
      // GROUP LINK HANDLING
      // =========================
      if (q.includes("chat.whatsapp.com/")) {
        const code = q.split("https://chat.whatsapp.com/")[1]?.trim();

        if (!code) {
          return await reply("❌ Invalid group link.");
        }

        try {
          const groupInfo = await sock.groupGetInviteInfo(code);
          if (!groupInfo || !groupInfo.id) {
            return await reply("❌ Group not found or link is revoked.");
          }
          // Agar id group wali hai tou theek, warna '@g.us' khud lagayengy
          targetJid = groupInfo.id.includes('@g.us') ? groupInfo.id : `${groupInfo.id}@g.us`;
          
        } catch (error) {
          return await reply("❌ Failed to get group info. Link might be invalid.");
        }
      }

      // =========================
      // PHONE NUMBER HANDLING
      // =========================
      else {
        // Sirf numbers filter kar rahy hain (+ ya spaces hata kar)
        let number = q.replace(/[^0-9]/g, "");

        if (number.length < 10 || number.length > 15) {
          return await reply("❌ Invalid number. Please provide a valid phone number.");
        }

        // WhatsApp ka standard user JID format
        targetJid = `${number}@s.whatsapp.net`;
      }

      // =========================
      // GET PROFILE PHOTO
      // =========================
      let ppUrl;
      try {
        ppUrl = await sock.profilePictureUrl(targetJid, "image");
      } catch (error) {
        return await reply("❌ Profile picture not found. (User may have hidden it or doesn't have one).");
      }

      // =========================
      // SEND IMAGE
      // =========================
      if (ppUrl) {
        await sock.sendMessage(
          from,
          {
            image: { url: ppUrl },
            caption: `╭━━〔 *PROFILE PICTURE* 〕━━┈⊷\n┃\n┃◈ • 🆔 ${targetJid}\n┃◈ • ✅ Profile fetched successfully\n┃\n╰──────────────┈⊷\n> 🤖 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚀𝙰𝙳𝙴𝙴𝚁 𝙰𝙸`
          },
          { quoted: msg }
        );
      }

    } catch (err) {
      console.error("GETPP CMD ERROR:", err);
      // Agar phir bhi koi unknown error aaye tou crash hone k bajaye bot ye message bhejega
      await sock.sendMessage(
        from, 
        { text: `❌ Unexpected Error: ${err.message}` }, 
        { quoted: msg }
      );
    }
  }
};
