const axios = require('axios');

function styledBox(title, rows) {
  const body = rows.map(([emoji, label, value]) =>
    `│  ✦ ${emoji} ${label}: ${value || ''}`
  ).join('\n');
  return `
╭──✦──────────────╮
│  ✦ ${title} ✦
│  ✦━━━━━━━━━━━━━━✦
${body}
╰──✦──────────────╯

🌙 *Powered by SYED MD*
`;
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return (num || 0).toString();
}

module.exports = {
  name: 'tiktokuser',
  aliases: ['ttuser', 'tiktokprofile', 'ttprofile', 'tt'],
  category: 'general',
  description: 'Get TikTok user profile statistics (multi-API fallback)',
  usage: '.tiktokuser <username>',

  async execute(sock, msg, args, extra) {
    const username = args.join(' ').trim();

    if (!username) {
      return extra.reply(`🌙 *TikTok Profile Stats*

╭──✦──────────────╮
│  ✦ 📊 HOW TO USE ✦
│  ✦━━━━━━━━━━━━━━✦
│  ✦ 📝 .tiktokuser <username>
│  ✦━━━━━━━━━━━━━━✦
│  ✦ Example: .tiktokuser mrbeast
╰──✦──────────────╯

🌙 *Powered by SYED MD*`);
    }

    try {
      // Multiple APIs — agar ek fail ho to agli try hoti hai automatically
      let userData = null;

      const apiUrls = [
        `https://api.giftedtech.co.ke/api/tiktok/user?apikey=gifted&username=${encodeURIComponent(username)}`,
        `https://www.tikwm.com/api/user?unique_id=${encodeURIComponent(username)}`
      ];

      for (const url of apiUrls) {
        try {
          const response = await axios.get(url, { timeout: 15000 });
          if (response.data && (response.data.result || response.data.data)) {
            userData = response.data.result || response.data.data;
            break;
          }
        } catch (e) {
          continue; // Agli API try karo
        }
      }

      if (!userData) {
        return extra.reply(`❌ User "@${username}" not found! Please check the username.`);
      }

      const userInfo = {
        username: userData.unique_id || userData.username || username,
        nickname: userData.nickname || userData.name || userData.username || username,
        bio: userData.signature || userData.bio || userData.description || 'No bio available',
        avatar: userData.avatar || userData.avatar_larger || userData.profile_pic || null,
        followers: userData.follower_count || userData.followers || 0,
        following: userData.following_count || userData.following || 0,
        likes: userData.heart_count || userData.likes || 0,
        videos: userData.video_count || userData.videos || 0,
        isVerified: userData.verified || userData.is_verified || false,
        privateAccount: userData.private_account || userData.is_private || false,
        region: userData.region || userData.country || 'N/A'
      };

      const verifiedEmoji = userInfo.isVerified ? '✅' : '❌';
      const privateEmoji = userInfo.privateAccount ? '🔒' : '🌐';

      const responseText = styledBox('📊 TIKTOK PROFILE', [
        ['👤', 'Username', `@${userInfo.username}`],
        ['📛', 'Nickname', userInfo.nickname],
        ['📝', 'Bio', userInfo.bio.substring(0, 60) + (userInfo.bio.length > 60 ? '...' : '')],
        ['👥', 'Followers', `${formatNumber(userInfo.followers)} (${userInfo.followers.toLocaleString()})`],
        ['👣', 'Following', `${formatNumber(userInfo.following)} (${userInfo.following.toLocaleString()})`],
        ['❤️', 'Total Likes', `${formatNumber(userInfo.likes)} (${userInfo.likes.toLocaleString()})`],
        ['🎬', 'Total Videos', `${formatNumber(userInfo.videos)} (${userInfo.videos.toLocaleString()})`],
        ['🌍', 'Region', userInfo.region],
        ['✅', 'Verified', verifiedEmoji],
        ['🔒', 'Private', privateEmoji]
      ]);

      if (userInfo.avatar) {
        await sock.sendMessage(extra.from, {
          image: { url: userInfo.avatar },
          caption: responseText
        }, { quoted: msg });
      } else {
        await extra.reply(responseText);
      }

    } catch (error) {
      console.error('tiktokuser command error:', error.message);
      let errorMsg = `❌ Error: ${error.message || 'Unknown error'}`;
      if (error.code === 'ECONNABORTED') {
        errorMsg = `⏳ Request timeout! Please try again later.`;
      }
      return extra.reply(errorMsg);
    }
  }
};
