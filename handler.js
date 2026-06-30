const config = require('./config');
const { loadCommands } = require('./utils/commandLoader');
const axios = require('axios');
const { loadData, saveData } = require('./utils/anticallManager');
const fs = require('fs');
const path = require('path');
const { normalizeJid, resolveLidToPn, extractNumber } = require('./utils/jidHelper');

// Load all commands
const commands = loadCommands();

// ─── Persona File Path ────────────────────────────────────────────────────────
const PERSONA_FILE = path.join(__dirname, 'data', 'persona.json');

// Default persona (fallback agar file na mile)
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

// Persona file exist na kare to create karo
if (!fs.existsSync(PERSONA_FILE)) {
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(PERSONA_FILE, JSON.stringify({ prompt: DEFAULT_PERSONA }, null, 2), 'utf8');
}

// Live persona loader — har message par fresh padhta hai
const getPersona = () => {
  try {
    const raw = fs.readFileSync(PERSONA_FILE, 'utf8');
    return JSON.parse(raw).prompt || DEFAULT_PERSONA;
  } catch {
    return DEFAULT_PERSONA;
  }
};

// ─── Owner Check (Updated for Bot Number) ─────────────────────────────────────
const isOwner = (senderJid, sock, activeConfig) => {
  if (!senderJid) return false;
  
  const senderNum = extractNumber(senderJid);
  
  // 1. Config.js wali list check karein
  if (activeConfig.ownerNumber.includes(senderNum)) return true;
  
  // 2. Bot ka apna connected number hamesha owner rahay
  if (sock && sock.user && sock.user.id) {
    const botNum = extractNumber(sock.user.id);
    if (senderNum === botNum) return true;
    
    // Check LID if available
    if (sock.user.lid && extractNumber(sock.user.lid) === senderNum) return true;
  }
  
  return false;
};

// ─── Main Message Handler ─────────────────────────────────────────────────────
const handleMessage = async (sock, msg) => {
  try {
    if (!msg.message) return;

    const from = normalizeJid(msg.key.remoteJid);
    if (from.includes('@broadcast') || from.includes('@newsletter')) return;

    // Refresh Config Live
    delete require.cache[require.resolve('./config')];
    const activeConfig = require('./config');

    const isGroup = from.endsWith('@g.us');
    const isFromMe = msg.key.fromMe;
    
    // Sender ID theek se extract karna
    const sender = normalizeJid(msg.key.participant || msg.key.remoteJid);
    
    const userName = msg.pushName || 'Friend';
    const isSenderOwner = isOwner(sender, sock, activeConfig);

    // Message ka text extract karna
    let contentMsg = msg.message?.ephemeralMessage?.message || msg.message?.viewOnceMessageV2?.message || msg.message;
    let body = contentMsg?.conversation || contentMsg?.extendedTextMessage?.text || contentMsg?.imageMessage?.caption || contentMsg?.videoMessage?.caption || '';
    let textMsg = body.trim();
    
    // 🚀 NEW: NOPREFIX LOGIC ADDED HERE
    let isCmd = false;
    let commandName = '';
    let args = [];

    if (textMsg.startsWith(activeConfig.prefix)) {
      // With Prefix
      isCmd = true;
      args = textMsg.slice(activeConfig.prefix.length).trim().split(/\s+/);
      commandName = args.shift().toLowerCase();
    } else if (activeConfig.noprefix) {
      // Without Prefix (If enabled in config)
      let tempArgs = textMsg.trim().split(/\s+/);
      let possibleCmd = tempArgs[0]?.toLowerCase();
      
      let commandExists = commands.has(possibleCmd);
      if (!commandExists) {
        for (const cmd of commands.values()) {
          if (cmd.aliases && cmd.aliases.includes(possibleCmd)) {
            commandExists = true;
            break;
          }
        }
      }

      if (commandExists) {
        isCmd = true;
        commandName = possibleCmd;
        args = tempArgs.slice(1);
      }
    }

    // ================= 1. CHATBOT FEATURE (AI Auto Reply) =================
    if (activeConfig.autoReply && !isFromMe && !isGroup) {
      if (!isCmd && textMsg.length > 0) {
        await sock.sendPresenceUpdate('composing', from);

        const persona = getPersona().replace(/\{name\}/g, userName);

        try {
          const res = await axios.get(
            `https://arslan-apis-v2.vercel.app/ai/blackbox?q=${encodeURIComponent(persona + textMsg)}`
          );
          if (res.data.status && res.data.result) {
            await sock.sendMessage(
              from,
              { text: res.data.result.trim() },
              { quoted: msg }
            );
          }
        } catch (err) {
          console.error('Chatbot Error: ', err.message);
        }
      }
    }

    // ================= 2. MODE FEATURE & COMMAND EXECUTION =================
    if (!isCmd) return;

    if (activeConfig.selfMode && !isSenderOwner && !isFromMe) {
      return; 
    }

    // Yahan pe direct command check kar raha hai kyunke upar args parse ho chuke hain
    const command = commands.get(commandName) || Array.from(commands.values()).find(c => c.aliases && c.aliases.includes(commandName));
    if (!command) return;

    if (command.ownerOnly && !isSenderOwner && !isFromMe) {
      return sock.sendMessage(
        from,
        { text: activeConfig.messages.ownerOnly },
        { quoted: msg }
      );
    }

    // Command Execute karna (Simple style, no Meta AI tags)
    await command.execute(sock, msg, args, {
      from,
      sender,
      isGroup,
      isOwner: isSenderOwner || isFromMe,
      reply: (text) => sock.sendMessage(from, { text }, { quoted: msg })
    });

  } catch (error) {
    console.error('Error in message handler:', error);
  }
};

// ================= 3. ANTI-CALL FEATURE =================
const initializeAntiCall = (sock) => {
  setInterval(async () => {
    try {
      const data = loadData();
      if (!data.enabled) return;
      const now = Date.now();
      const DAY = 24 * 60 * 60 * 1000;
      let changed = false;

      for (const user in data.blocked) {
        if (now - data.blocked[user] >= DAY) {
          await sock.updateBlockStatus(user, 'unblock');
          delete data.blocked[user];
          delete data.warnings[user];
          changed = true;
        }
      }
      if (changed) saveData(data);
    } catch (err) {
      console.error('Auto-Unblock Error', err);
    }
  }, 60 * 60 * 1000);

  sock.ev.on('call', async (calls) => {
    try {
      const data = loadData();
      if (!data.enabled) return;
      
      // 🔄 Live config read karo takay whitelist update hoti rahay
      delete require.cache[require.resolve('./config')];
      const activeConfig = require('./config');

      const now = Date.now();
      const DAY = 24 * 60 * 60 * 1000;
      let changed = false;

      for (const call of calls) {
        if (call.status !== 'offer') continue;
        
        const caller = normalizeJid(call.from);
        const callerNumber = extractNumber(caller);

        // 🛡️ WHITELIST CHECK: Owners aur Allowed Callers ko ignore karna hai
        const isOwner = activeConfig.ownerNumber.includes(callerNumber);
        const isAllowedCaller = (activeConfig.allowedCallers || []).includes(callerNumber);

        if (isOwner || isAllowedCaller) {
          console.log(`[🛡️ SYED MD] Call bypassed for whitelisted number: ${callerNumber}`);
          continue; 
        }

        changed = true;
        await sock.rejectCall(call.id, caller);

        if (data.warnings[caller] && now - data.warnings[caller].lastTime >= DAY) {
          delete data.warnings[caller];
        }

        if (!data.warnings[caller]) {
          data.warnings[caller] = { count: 0, lastTime: now };
        }

        data.warnings[caller].count++;
        data.warnings[caller].lastTime = now;
        const warningCount = data.warnings[caller].count;

        if (warningCount <= 3) {
          await sock.sendMessage(caller, {
            text: `⚠️ Warning ${warningCount}/3\n\n🚫 Calls are not allowed in this bot. After 3 warnings you will be blocked.`
          });
        }

        if (warningCount >= 4) {
          await sock.sendMessage(caller, {
            text: `> ⚠️ *FINAL WARNING!*\n> 🚫 You have been blocked for calling.`
          });
          await sock.updateBlockStatus(caller, 'block');
          data.blocked[caller] = now;
          delete data.warnings[caller];
        }
      }
      if (changed) saveData(data);
    } catch (err) {
      console.error('AntiCall Error', err);
    }
  });
};

module.exports = {
  handleMessage,
  initializeAntiCall,
  isOwner
};
