const fs = require('fs');
const path = require('path');
const axios = require('axios');

const PERSONA_FILE = path.join(__dirname, '..', 'data', 'persona.json');
const DEFAULT_PERSONA = 
  'You are SYED-AI, a friendly WhatsApp AI created by Syed Abdul Wahab Bukhari.\n\n' +
  'Rules:\n' +
  '- Reply in the user\'s language (English, Urdu, or Roman Urdu).\n' +
  '- Keep answers short, natural, and helpful.\n' +
  '- If asked who you are or who created you, say:\n' +
  '  "I am SYED-AI created by Syed Abdul Wahab Bukhari."\n' +
  '- Never claim to be human.\n' +
  '- Be respectful and honest.\n\n' +
  'User message:\n';

// Persona read karne ka function
const getPersona = () => {
  try {
    if (fs.existsSync(PERSONA_FILE)) {
      const raw = fs.readFileSync(PERSONA_FILE, 'utf8');
      return JSON.parse(raw).prompt || DEFAULT_PERSONA;
    }
    return DEFAULT_PERSONA;
  } catch {
    return DEFAULT_PERSONA;
  }
};

module.exports = {
  name: 'ai',
  aliases: ['gpt', 'bot', 'ask'],
  category: 'ai',
  description: 'Ask anything from SYED-AI',
  
  async execute(sock, msg, args, { from, reply }) {
    try {
      // Check agar user ne kuch likha hi nahi
      if (args.length === 0) {
        return reply('Please provide a query!\nExample: .ai Hello, how are you?');
      }

      const query = args.join(' ');
      const userName = msg.pushName || 'Friend';

      // Bot ko 'composing' (typing...) state mein lana
      await sock.sendPresenceUpdate('composing', from);

      // Persona fetch karna aur user ka naam dynamic set karna
      const persona = getPersona().replace(/\{name\}/g, userName);

      // API Call (Same handler wala logic use kiya hai)
      const res = await axios.get(`https://arslan-apis-v2.vercel.app/ai/blackbox?q=${encodeURIComponent(persona + '\n' + query)}`);
      
      let replyText = res.data.result || res.data.reply || res.data.message || (typeof res.data === 'string' ? res.data : null);
      
      if (replyText) {
        return reply(String(replyText).trim());
      } else {
        return reply('Sorry, I couldn\'t fetch a response from the AI.');
      }

    } catch (err) {
      console.error('AI Command Error:', err.message);
      return reply('An error occurred while processing your request.');
    }
  }
};
    
