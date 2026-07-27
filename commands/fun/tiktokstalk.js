const axios = require('axios');
const cheerio = require('cheerio'); // npm install cheerio

module.exports = {
  name: 'tiktokstalk',
  aliases: ['tstalk', 'tinfo'],
  category: 'fun',
  description: 'Fetch TikTok user profile details (direct scraping, no API).',
  usage: '.tinfo <username>',

  async execute(sock, msg, args, extra) {
    try {
      const q = args.join(' ').trim().replace('@', '');

      if (!q) {
        return extra.reply('❎ Please provide a TikTok username.\n\n*Example:* .tinfo mrbeast');
      }

      const profileUrl = `https://www.tiktok.com/@${encodeURIComponent(q)}`;

      let html;
      try {
        const response = await axios.get(profileUrl, {
          timeout: 15000,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          },
        });
        html = response.data;
      } catch (fetchErr) {
        console.error('❌ Fetch failed:', fetchErr.message);
        return extra.reply('⚠️ Could not reach TikTok right now. Try again in a bit.');
      }

      const $ = cheerio.load(html);
      const rawScript = $('#__UNIVERSAL_DATA_FOR_REHYDRATION__').html();

      if (!rawScript) {
        return extra.reply('❌ User not found, account is private/banned, or TikTok blocked this request.');
      }

      let json;
      try {
        json = JSON.parse(rawScript);
      } catch (parseErr) {
        console.error('❌ JSON parse failed:', parseErr.message);
        return extra.reply('⚠️ Failed to read profile data (TikTok may have changed its page structure).');
      }

      const userDetail = json?.__DEFAULT_SCOPE__?.['webapp.user-detail'];
      const userInfo = userDetail?.userInfo;

      if (!userInfo || userDetail?.statusCode !== 0) {
        return extra.reply('❌ User not found. Please check the username and try again.');
      }

      const user = userInfo.user || {};
      const stats = userInfo.stats || {};

      const safe = (val, fallback = 'N/A') =>
        val !== undefined && val !== null && val !== '' ? val : fallback;

      const formatNum = (n) => {
        const num = Number(n);
        return Number.isFinite(num) ? num.toLocaleString() : 'N/A';
      };

      const createdDate = user.createTime
        ? new Date(user.createTime * 1000).toLocaleDateString()
        : 'N/A';

      const profileInfo = `🎭 *TikTok Profile Stalker* 🎭

👤 *Username:* @${safe(user.uniqueId, q)}
📛 *Nickname:* ${safe(user.nickname)}
✅ *Verified:* ${user.verified ? 'Yes ✅' : 'No ❌'}
📍 *Region:* ${safe(user.region)}
📝 *Bio:* ${safe(user.signature, 'No bio available.')}
🔗 *Bio Link:* ${safe(user.bioLink?.link, 'No link available.')}

📊 *Statistics:*
👥 *Followers:* ${formatNum(stats.followerCount)}
👤 *Following:* ${formatNum(stats.followingCount)}
❤️ *Likes:* ${formatNum(stats.heartCount ?? stats.heart)}
🎥 *Videos:* ${formatNum(stats.videoCount)}

📅 *Account Created:* ${createdDate}
🔒 *Private Account:* ${user.privateAccount ? 'Yes 🔒' : 'No 🌍'}

🔗 *Profile URL:* ${profileUrl}
`;

      const avatarUrl = user.avatarLarger || user.avatarMedium || user.avatarThumb;

      if (avatarUrl) {
        await sock.sendMessage(
          extra.from,
          { image: { url: avatarUrl }, caption: profileInfo },
          { quoted: msg }
        );
      } else {
        // Fallback: no image found, just send text so command still works
        await sock.sendMessage(extra.from, { text: profileInfo }, { quoted: msg });
      }
    } catch (error) {
      console.error('❌ Error in TikTok stalk command:', error);
      return extra.reply('⚠️ An unexpected error occurred while fetching TikTok profile data.');
    }
  },
};
