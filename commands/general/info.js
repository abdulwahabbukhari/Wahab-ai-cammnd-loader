const axios = require('axios');

module.exports = {
  name: 'info',
  aliases: ['sim', 'siminfo', 'cnic'],
  category: 'general', // Menu par show karne ke liye general set kar diya
  description: 'Fetch SIM or CNIC information for Pakistan, India, and Brazil',
  usage: '.info [number or cnic]',

  async execute(sock, msg, args, extra) {
    const from = extra.from || msg.key.remoteJid;

    if (!args[0]) {
        return sock.sendMessage(from, { 
            text: "╭━━━〔 ⚠️ *MISSING INPUT* 〕━━━👉\n┃\n┃ ⚠️ *Error:* Input missing!\n┃ 📝 *Format:* `.info [Number/CNIC]`\n┃\n┃ 💡 *Examples:*\n┃ 🇵🇰 `.info 923034410077`\n┃ 🇵🇰 `.info 3120307272689` (CNIC)\n┃ 🇮🇳 `.info 918276093956`\n┃ 🇧🇷 `.info 5513996666666`\n┃\n╰━━━━━━━━━━━━━━━━━━━━━━━👉" 
        }, { quoted: msg });
    }

    let cleanInput = args[0].replace(/[^0-9]/g, ''); // Sirf numbers filter karein
    let apiUrl = '';
    let countryFlag = '';
    let countryName = '';
    let isCnic = false;

    // Logic for checking CNIC or Country Code
    if (cleanInput.length === 13 && !cleanInput.startsWith('91') && !cleanInput.startsWith('55')) {
        // Pakistani CNIC (13 digits standard)
        apiUrl = `https://public.codexdart.site/pak.php?num=${cleanInput}`;
        countryFlag = '🇵🇰';
        countryName = 'Pakistan (CNIC Search)';
        isCnic = true;
    } else if (cleanInput.startsWith('92')) {
        // Pakistan Number
        let pakNum = cleanInput.substring(2); 
        apiUrl = `https://public.codexdart.site/pak.php?num=${pakNum}`;
        countryFlag = '🇵🇰';
        countryName = 'Pakistan';
    } else if (cleanInput.startsWith('03') && cleanInput.length === 11) {
        // Direct local Pak number format (e.g., 0304...)
        apiUrl = `https://public.codexdart.site/pak.php?num=${cleanInput}`;
        countryFlag = '🇵🇰';
        countryName = 'Pakistan';
    } else if (cleanNumber.startsWith('91')) {
        // India
        let indNum = cleanInput.substring(2);
        apiUrl = `https://public.codexdart.site/ind.php?num=${indNum}`;
        countryFlag = '🇮🇳';
        countryName = 'India';
    } else if (cleanInput.startsWith('55')) {
        // Brazil
        apiUrl = `https://public.codexdart.site/brazil.php?query=${cleanInput}`;
        countryFlag = '🇧🇷';
        countryName = 'Brazil';
    } else {
        // If user enters 10 digit local number without 92, default to Pak
        if (cleanInput.length === 10 && cleanInput.startsWith('3')) {
            apiUrl = `https://public.codexdart.site/pak.php?num=${cleanInput}`;
            countryFlag = '🇵🇰';
            countryName = 'Pakistan';
        } else {
            return sock.sendMessage(from, { 
                text: "❌ *Invalid Format!* Please use proper country code or a valid 13-digit Pakistani CNIC." 
            }, { quoted: msg });
        }
    }

    try {
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (!data || Object.keys(data).length === 0 || data.status === false || data.status === "false") {
            return sock.sendMessage(from, { 
                text: `❌ No records found for this input in ${countryName} database.` 
            }, { quoted: msg });
        }

        // Main Stylish Header
        let output = `⚡ 📲  *S Y S T E M   N E T W O R K*  📲 ⚡\n`;
        output += `┏━━━━━━━━━━━━━━━━━━━━━━━━👉\n`;
        output += `┃ 🌍 *REGION:* ${countryFlag} ${countryName.toUpperCase()}\n`;
        output += `┃ 📊 *STATUS:* Database Connected\n`;
        output += `┗━━━━━━━━━━━━━━━━━━━━━━━━👉\n\n`;

        // Handling Records array (For Pakistan Multiple Results)
        if (data.RECORDS && Array.isArray(data.RECORDS)) {
            data.RECORDS.forEach((record, index) => {
                output += ` 💠 *RECORD [0${index + 1}]* 💠\n`;
                output += `┌───────────────────────\n`;
                output += `│ 👤 *NAME:* ${record.name || 'N/A'}\n`;
                output += `│ 📱 *NUMBER:* ${record.mobile || 'N/A'}\n`;
                output += `│ 💳 *CNIC:* ${record.cnic || 'N/A'}\n`;
                output += `│ 🏠 *ADDRESS:* ${record.address || 'N/A'}\n`;
                output += `│ 📶 *NETWORK:* ${record.network || 'N/A'}\n`;
                output += `└───────────────────────\n\n`;
            });
        } else {
            // Fallback for India/Brazil or flat objects
            output += ` 💠 *RESULT DETAILS* 💠\n`;
            output += `┌───────────────────────\n`;
            for (let key in data) {
                // Skips the source provider text you wanted to remove
                if (key.toLowerCase() === 'developer' || key.toLowerCase() === 'channel' || key.toLowerCase() === 'status' || key.toLowerCase() === 'count') continue;
                
                if (typeof data[key] === 'object') {
                    output += `│ 🔗 *${key.toUpperCase()}:* ${JSON.stringify(data[key])}\n`;
                } else {
                    output += `│ 🔗 *${key.toUpperCase()}:* ${data[key]}\n`;
                }
            }
            output += `└───────────────────────\n\n`;
        }

        // Professional Footer Credits
        output += `✨ ─── ❖ ── ✦ ── ❖ ─── ✨\n`;
        output += `👑 *DEVILPOER:* Syed Abdul Wahab Bukhari\n`;
        output += `📢 *CHANNEL:* https://whatsapp.com/channel/0029VbD1rlH5Ui2NwN6idF2v\n`;
        output += `✨ ─── ❖ ── ✦ ── ❖ ─── ✨`;

        await sock.sendMessage(from, { text: output }, { quoted: msg });

    } catch (error) {
        console.error(error);
        await sock.sendMessage(from, { 
            text: "❌ *Database Error!* Connection timed out or API endpoint is currently down." 
        }, { quoted: msg });
    }
  }
};
      
                
