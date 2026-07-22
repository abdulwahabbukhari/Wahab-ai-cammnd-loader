module.exports = {
  name: 'lyrics',
  aliases: ['lyric', 'lirik', 'songtext'],
  category: 'music',
  ownerOnly: false,
  description: 'Get song lyrics with auto fallback APIs',
  usage: '.lyrics Imagine Dragons Believer',
  cooldown: 5,

  async execute(sock, msg, args, extra) {
    const { reply, from, prefix } = extra;
    const text = args.join(' ');

    // ✨ Input Validation
    if (!text) {
      return reply(`❌ *Please provide song name!*\n\n📌 *Example:*\n${prefix}lyrics Imagine Dragons Believer\n${prefix}lyrics Believer - Imagine Dragons`);
    }

    try {
      // 🎵 React with loading
      await sock.sendMessage(from, { react: { text: '🎵', key: msg.key } });
      reply('🎵 *sᴇᴀʀᴄʜɪɴɢ ʟʏʀɪᴄs...*');

      // 🔍 Parse Artist & Title
      let artist = '',
          title = '';

      if (text.includes('-')) {
        [title, artist] = text.split('-').map(v => v.trim());
      } else {
        const split = text.split(' ');
        artist = split[0];
        title = split.slice(1).join(' ');
      }

      // 🌐 Multi-API Fallback System
      const apis = [
        `https://api.siputzx.my.id/api/s/lyrics?query=${encodeURIComponent(text)}`,
        `https://api.nexoracle.com/search/lyrics?apikey=free_key@maher_apis&q=${encodeURIComponent(text)}`,
        `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`
      ];

      let result = null;

      for (const apiUrl of apis) {
        try {
          console.log(`🎵 Trying API: ${apiUrl}`);
          const { data: res } = await axios.get(apiUrl, { timeout: 15000 });

          // Extract lyrics from different response formats
          const lyrics = res.data?.lyrics || res.result?.lyrics || res.lyrics;
          
          if (lyrics) {
            result = res.data || res.result || res;
            break;
          }
        } catch (e) {
          console.log(`❌ API Failed: ${e.message}`);
          continue;
        }
      }

      // 🚫 No lyrics found
      if (!result || !result.lyrics) {
        throw new Error('Lyrics not found in any API');
      }

      // 📝 Format Lyrics (Trim if too long)
      let lyrics = result.lyrics;
      if (lyrics.length > 3000) {
        lyrics = lyrics.substring(0, 3000) + '\n\n_...ᴛʀᴜɴᴄᴀᴛᴇᴅ_';
      }

      // 🎨 Send Beautiful Lyrics Card
      await sock.sendMessage(from, {
        text: `╭━━━〔 *🎵 ʟʏʀɪᴄs* 〕━━━╮
│
│ ✦ *sᴏɴɢ:* ${result.title || title || 'Unknown'}
│ ✦ *ᴀʀᴛɪsᴛ:* ${result.artist || artist || 'Unknown'}
│
╰━━━━━━━━━╯

${lyrics}

━━━━━━━━━━
*ᴘᴏᴡᴇʀᴇᴅ ʙʏ XENORIZE MD*
© 2026 XENORIZE MD`
      }, { quoted: msg });

      // ✅ Success React
      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });

    } catch (error) {
      console.error('❌ Lyrics Error:', error.message);
      
      // ❌ Error React
      await sock.sendMessage(from, { react: { text: '❌', key: msg.key } });
      
      return reply(`❌ *ʟʏʀɪᴄs ɴᴏᴛ ғᴏᴜɴᴅ*\n\n📌 *Try:*\n${prefix}lyrics Ed Sheeran Perfect\n${prefix}lyrics Perfect - Ed Sheeran`);
    }
  }
};
