const axios = require('axios');

module.exports = {
  name: 'info',
  aliases: ['sim', 'siminfo', 'cnic'],
  category: 'general',
  description: 'Fetch SIM or CNIC information for Pakistan, India, and Brazil',
  usage: '.info [number or cnic]',

  async execute(sock, msg, args, extra) {
    const from = extra.from || msg.key.remoteJid;

    if (!args[0]) {
        return sock.sendMessage(from, { 
            text: "╭━━━〔 ⚠️ *MISSING INPUT* 〕━━━👉\n┃\n┃ ⚠️ *Error:* Input missing!\n┃ 📝 *Format:* `.info [Number/CNIC]`\n┃\n┃ 💡 *Examples:*\n┃ 🇵🇰 `.info 923034410077`\n┃ 🇵🇰 `.info 3120307272689` (CNIC)\n┃ 🇮🇳 `.info 918276093956`\n┃ 🇧🇷 `.info 5513996666666`\n┃\n╰━━━━━━━━━━━━━━━━━━━━━━━👉" 
        }, { quoted: msg });
    }

    let cleanInput = args[0].replace(/[^0-9]/g, ''); 
    let apiUrl = '';
    let countryFlag = '';
    let countryName = '';

    // Logic checks
    if (cleanInput.length === 13 && !cleanInput.startsWith('91') && !cleanInput.startsWith('55')) {
        apiUrl = `https://public.codexdart.site/pak.php?num=${cleanInput}`;
        countryFlag = '🇵🇰';
        countryName = 'Pakistan (CNIC)';
    } else if (cleanInput.startsWith('92')) {
        let pakNum = cleanInput.substring(2); 
        apiUrl = `https://public.codexdart.site/pak.php?num=${pakNum}`;
        countryFlag = '🇵🇰';
        countryName = 'Pakistan';
    } else if (cleanInput.startsWith('03') && cleanInput.length === 11) {
        apiUrl = `https://public.codexdart.site/pak.php?num=${cleanInput}`;
        countryFlag = '🇵🇰';
        countryName = 'Pakistan';
    } else if (cleanInput.startsWith('91')) {
        let indNum = cleanInput.substring(2);
        apiUrl = `https://public.codexdart.site/ind.php?num=${indNum}`;
        countryFlag = '🇮🇳';
        countryName = 'India';
    } else if (cleanInput.startsWith('55')) {
        apiUrl = `https://public.codexdart.site/brazil.php?query=${cleanInput}`;
        countryFlag = '🇧🇷';
        countryName = 'Brazil';
    } else {
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

        if (!data || data.status === false || data.status === "false") {
            return sock.sendMessage(from, { 
                text: `❌ No records found for this input in ${countryName} database.` 
            }, { quoted: msg });
        }

        // V.I.P Header Design
        let output = `⚡ 📲  *S Y S T E M   N E T W O R K*  📲 ⚡\n`;
        output += `╔══════════════════════╗\n`;
        output += `   🌍 *REGION:* ${countryFlag} ${countryName.toUpperCase()}\n`;
        output += `   📊 *STATUS:* Cyber Live Connected\n`;
        output += `╚══════════════════════╝\n\n`;

        // Check for Pakistani Array (handles uppercase or lowercase keys from API)
        let recordsArray = data.RECORDS || data.records || null;

        if (recordsArray && Array.isArray(recordsArray) && recordsArray.length > 0) {
            recordsArray.forEach((record, index) => {
                output += `📂 *[ DATA RECORD 0${index + 1} ]* ────────────────\n`;
                output += `┌──────────────────────────────┐\n`;
                output += `  👤 *NAME:* \`${record.name || 'N/A'}\`\n`;
                output += `  📱 *NUMBER:* \`${record.mobile || record.number || 'N/A'}\`\n`;
                output += `  💳 *CNIC:* \`${record.cnic || 'N/A'}\`\n`;
                output += `  📶 *NETWORK:* \`${record.network || 'N/A'}\`\n`;
                output += `  🏠 *ADDRESS:* \`${record.address || 'N/A'}\`\n`;
                output += `└──────────────────────────────┘\n\n`;
            });
        } else {
            // India / Brazil or Flat Data Objects
            output += `📂 *[ DATABASE RESULT ]* ────────────────\n`;
            output += `┌──────────────────────────────┐\n`;
            let hasValidData = false;
            
            for (let key in data) {
                let lowerKey = key.toLowerCase();
                if (['developer', 'channel', 'status', 'count', 'records'].includes(lowerKey)) continue;
                
                hasValidData = true;
                let val = typeof data[key] === 'object' ? JSON.stringify(data[key]) : data[key];
                output += `  🔹 *${key.toUpperCase()}:* \`${val}\`\n`;
            }
            
            // If the structure had data inside a flat array or something else
            if (!hasValidData) {
                output += `  📝 *RAW DATA:* \`${JSON.stringify(data)}\`\n`;
            }
            output += `└──────────────────────────────┘\n\n`;
        }

        // Premium Dark/Neon Style Footer Credits
        output += `✨ 💎 👤 *DEVILPOER CREDITS* 👤 💎 ✨\n`;
        output += `╭──────────────────────────────╮\n`;
        output += `  👑 *DEVILPOER:* Syed Abdul Wahab Bukhari\n`;
        output += `  📢 *CHANNEL:* https://whatsapp.com/channel/0029VbD1rlH5Ui2NwN6idF2v\n`;
        output += `╰──────────────────────────────╯`;

        await sock.sendMessage(from, { text: output }, { quoted: msg });

    } catch (error) {
        console.error(error);
        await sock.sendMessage(from, { 
            text: "❌ *Database Error!* Connection timed out or API endpoint is currently down." 
        }, { quoted: msg });
    }
  }
};
          
