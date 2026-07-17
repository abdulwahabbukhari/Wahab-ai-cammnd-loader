const axios = require('axios');

module.exports = {
  name: 'mediafire',
  aliases: ['mfire', 'mf', 'mediafiredl'],
  category: 'media',
  description: 'Download files from a MediaFire link',
  usage: '.mediafire <mediafire-link>',

  async execute(sock, msg, args, extra) {
    try {
      if (!args[0] || !args[0].includes('mediafire.com')) {
        return extra.reply('❌ Sahi MediaFire link dein!\n\nUsage:\n.mediafire https://www.mediafire.com/file/xxxxx/filename/file');
      }

      const url = args[0].trim();
      await extra.reply('⏳ File fetch ho rahi hai, thoda intezaar karein...');

      const res = await axios.get(`https://arslan-apis-v2.vercel.app/download/mfire?url=${encodeURIComponent(url)}`);
      const data = res.data;

      if (!data || data.status === false) {
        return extra.reply(`❌ File fetch nahi ho saki.\n${data?.err ? `Wajah: ${data.err}` : 'Link check karein aur dobara try karein.'}`);
      }

      // API ka result kabhi 'result' key mein, kabhi 'data' key mein aata hai — dono handle karte hain
      const result = data.result || data.data || data;

      const downloadUrl = result?.downloadUrl || result?.url || result?.link;
      const fileName = result?.fileName || result?.name || result?.filename || 'file';
      const fileSize = result?.size || result?.fileSize || null;

      if (!downloadUrl) {
        return extra.reply('❌ Download link nahi mil saka is MediaFire URL se. Link check karein.');
      }

      const caption = `📁 *MediaFire Download*\n\n📄 Name: ${fileName}${fileSize ? `\n📦 Size: ${fileSize}` : ''}`;

      // File download karke document ki tarah bhejte hain (kisi bhi file-type ko support karta hai)
      const fileRes = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
      const fileBuffer = Buffer.from(fileRes.data);

      await sock.sendMessage(extra.from, {
        document: fileBuffer,
        fileName: fileName,
        caption: caption,
        mimetype: fileRes.headers['content-type'] || 'application/octet-stream'
      }, { quoted: msg });

    } catch (error) {
      console.error('mediafire command error:', error.message);
      return extra.reply('❌ MediaFire se file download karte waqt error aya. Link check karein ya baad mein try karein.');
    }
  }
};
