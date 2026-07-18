module.exports = {
  name: 'insult',
  aliases: ['roast', 'burn'],
  category: 'owner',
  ownerOnly: true,
  description: 'Roast a mentioned or replied user with a random insult',
  usage: '.insult @user or reply .insult',

  async execute(sock, msg, args, extra) {
    try {
      const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
      const mentionedJid = contextInfo?.mentionedJid;
      const quotedSender = contextInfo?.participant;

      let target = null;

      // Case 1: Mention kiya hai to use target
      if (mentionedJid && mentionedJid.length > 0) {
        target = mentionedJid[0];
      }
      // Case 2: Kisi ke message pe reply kiya hai to usko target
      else if (quotedSender) {
        target = quotedSender;
      }

      if (!target) {
        return extra.reply('❌ Kisi ko mention karein ya unke message ko reply karke .insult likhein!\n\nUsage:\n.insult @user\n.insult (reply to someone)');
      }

      const targetName = target.split('@')[0];

      const insults = [
        `@${targetName} tumhari soch itni chhoti hai ke usay microscope se bhi dhoondna padega. 🔬`,
        `@${targetName} tum wo insaan ho jise dekh kar Google bhi confuse ho jaye "did you mean: kuch aur ban jao?" 😂`,
        `@${targetName} tumhari acting itni acting hai ke Oscars bhi keh dein "bhai reality mein aa jao". 🎭`,
        `@${targetName} agar bewakoofi Olympics hoti, tum gold medal apni pocket mein rakh kar aate. 🥇`,
        `@${targetName} tum us WiFi jaise ho jo dikhta to hai lekin connect kabhi nahi hota. 📶`,
        `@${targetName} tumhari IQ dekh kar calculator bhi keh de "error 404, brain not found". 🧮`,
        `@${targetName} tum ek zinda proof ho ke evolution kabhi kabhi reverse bhi ho sakta hai. 🐒`,
        `@${targetName} tumse baat karke lagta hai jaise phone ka signal chala gaya ho — kuch samajh nahi aata. 📵`,
        `@${targetName} tum us autocorrect jaise ho jo sahi likho to bhi galat kar deta hai. ⌨️`,
        `@${targetName} tumhari personality dekh kar lagta hai ke Wi-Fi router bhi zyada interesting hoga. 📡`,
        `@${targetName} tum wo movie ho jise log sirf trailer dekh kar skip kar dete hain. 🎬`,
        `@${targetName} tumhari life ek loading bar ki tarah hai — kabhi khatam hi nahi hoti aur kuch nahi hota. ⏳`
      ];

      const randomInsult = insults[Math.floor(Math.random() * insults.length)];

      await sock.sendMessage(extra.from, {
        text: randomInsult,
        mentions: [target]
      }, { quoted: msg });

    } catch (error) {
      console.error('insult command error:', error.message);
      return extra.reply('❌ Insult generate karte waqt error aya.');
    }
  }
};
