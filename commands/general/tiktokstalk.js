const axios = require('axios');

module.exports = {
  name: 'tiktokstalk',
  aliases: ['tstalk', 'ttstalk'],
  category: 'general',
  description: 'Fetch TikTok user profile details.',
  usage: '.tiktokstalk <username>',

  async execute(sock, msg, args, extra) {
    try {
      const q = args.join(' ').trim();

      if (!q) {
        return extra.reply('❎ Please provide a TikTok username.\n\n*Example:* .tiktokstalk mrbeast');
      }

      const apiUrl = `https://api.siputzx.my.id/api/stalk/tiktok?username=${encodeURIComponent(q)}`;
      const { data } = await axios.get(apiUrl);

      if (!data.status) {
        return extra.reply('❌ User not found. Please check the username and try again.');
      }

      const user = data.data.user;
      const stats = data.data.stats;

      const profileInfo = `🎭 *TikTok Profile Stalker* 🎭

👤 *Username:* @${user.uniqueId}
📛 *Nickname:* ${user.nickname}
✅ *Verified:* ${user.verified ? 'Yes ✅' : 'No ❌'}
📍 *Region:* ${user.region}
📝 *Bio:* ${user.signature || 'No bio available.'}
🔗 *Bio Link:* ${user.bioLink?.link || 'No link available.'}

📊 *Statistics:*
👥 *Followers:* ${stats.followerCount.toLocaleString()}
👤 *Following:* ${stats.followingCount.toLocaleString()}
❤️ *Likes:* ${stats.heartCount.toLocaleString()}
🎥 *Videos:* ${stats.videoCount.toLocaleString()}

📅 *Account Created:* ${new Date(user.createTime * 1000).toLocaleDateString()}
🔒 *Private Account:* ${user.privateAccount ? 'Yes 🔒' : 'No 🌍'}

🔗 *Profile URL:* https://www.tiktok.com/@${user.uniqueId}
`;

      const profileImage = { image: { url: user.avatarLarger }, caption: profileInfo };

      await sock.sendMessage(extra.from, profileImage, { quoted: msg });

    } catch (error) {
      console.error('❌ Error in TikTok stalk command:', error.message);
      return extra.reply('⚠️ An error occurred while fetching TikTok profile data.');
    }
  }
};
