module.exports = {
  name: 'compliment',
  aliases: ['tareef', 'praise'],
  category: 'general',
  description: 'Give a random compliment to a mentioned or replied user',
  usage: '.compliment @user or reply .compliment',

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
      // Case 3: Koi target nahi to khud sender ko compliment de do
      else {
        target = extra.sender;
      }

      const targetName = target.split('@')[0];

      const compliments = [
        `@${targetName} tumhari muskurahat dekh kar lagta hai sooraj bhi thoda sharma jata hai. ☀️😊`,
        `@${targetName} tum wo insaan ho jo kisi bhi kamre mein aa jaye to poori vibe hi badal deta hai. ✨`,
        `@${targetName} tumhari soch itni gehri hai ke Einstein bhi tumse advice mangta. 🧠💫`,
        `@${targetName} tumhara dil itna acha hai ke ismein sabke liye jagah hai. ❤️`,
        `@${targetName} tumse baat karke din ki saari thakaan door ho jati hai. 🌸`,
        `@${targetName} tum us achi kitab jaise ho jise baar baar padhne ka mann kare. 📖✨`,
        `@${targetName} tumhari mehnat aur lagan sach mein qabil-e-tareef hai. 💪🌟`,
        `@${targetName} tum jitne khoobsurat dikhte ho, utne hi khoobsurat andar se bhi ho. 🌷`,
        `@${targetName} tumhari company mein waqt guzarna kabhi bura nahi lagta. ⏳💛`,
        `@${targetName} tum wo star ho jo kisi ki bhi zindagi mein roshni la sakta hai. ⭐`,
        `@${targetName} tumhari himmat aur positivity sach mein inspire karti hai. 🔥`,
        `@${targetName} Allah ne tumhe banate waqt zaroor extra time laga hoga — itni khoobi kahan se laate ho! 💎`
      ];

      const randomCompliment = compliments[Math.floor(Math.random() * compliments.length)];

      await sock.sendMessage(extra.from, {
        text: randomCompliment,
        mentions: [target]
      }, { quoted: msg });

    } catch (error) {
      console.error('compliment command error:', error.message);
      return extra.reply('❌ Compliment generate karte waqt error aya.');
    }
  }
};
