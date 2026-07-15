const config = require('./config');
const { loadCommands } = require('./utils/commandLoader');
const axios = require('axios');
const { loadData, saveData } = require('./utils/anticallManager');
const fs = require('fs');
const path = require('path');
const { normalizeJid, resolveLidToPn, extractNumber } = require('./utils/jidHelper');
const { getVoiceAIReply, textToSpeech } = require('./utils/voiceHandler');

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

// ─── ANTI-DELETE: In-Memory Message Cache ─────────────────────────────────────
// Structure: Map<messageId, { from, sender, isGroup, type, text, media: {buffer, mimetype, type}, timestamp }>
// RAM-only cache — bot restart hone par khud khatam ho jayega.
const messageStore = new Map();

// Cache ki size control karne ke liye (memory leak se bachne ke liye)
const MAX_CACHE_SIZE = 5000;
const addToStore = (id, data) => {
  if (messageStore.size >= MAX_CACHE_SIZE) {
    // sabse purana entry hata do
    const firstKey = messageStore.keys().next().value;
    messageStore.delete(firstKey);
  }
  messageStore.set(id, data);
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

    // ============= ANTI-DELETE: Cache every incoming message (text + media) =============
    if (activeConfig.antiDelete && !isFromMe) {
      try {
        const mediaTypeMap = {
          imageMessage: 'image',
          videoMessage: 'video',
          stickerMessage: 'sticker',
          audioMessage: 'audio',
          documentMessage: 'document'
        };

        let mediaType = null;
        let mediaContent = null;
        for (const key of Object.keys(mediaTypeMap)) {
          if (contentMsg?.[key]) {
            mediaType = mediaTypeMap[key];
            mediaContent = contentMsg[key];
            break;
          }
        }

        let mediaBuffer = null;
        let mediaMime = null;

        if (mediaType) {
          try {
            const { downloadMediaMessage } = require('@whiskeysockets/baileys');
            mediaBuffer = await downloadMediaMessage(
              { message: contentMsg, key: msg.key },
              'buffer',
              {},
              { logger: undefined, reuploadRequest: sock.updateMediaMessage }
            );
            mediaMime = mediaContent.mimetype || null;
          } catch (dlErr) {
            console.error('AntiDelete media download error:', dlErr.message);
          }
        }

        addToStore(msg.key.id, {
          from,
          sender,
          isGroup,
          userName,
          text: textMsg,
          mediaType,
          mediaBuffer,
          mediaMime,
          timestamp: Date.now()
        });
      } catch (cacheErr) {
        console.error('AntiDelete cache error:', cacheErr.message);
      }
    }

    // 🚀 NOPREFIX LOGIC
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

    // ================= 0. VOICE-TO-VOICE CHATBOT =================
    // Agar user voice note (audio message) bheje, to Groq Whisper se
    // text mein convert karte hain, AI se reply lete hain, phir usay
    // female voice (Edge TTS) mein convert karke voice note wapas
    // bhejte hain. DM mein hamesha; Group mein sirf mention/reply par.
    const audioContent = contentMsg?.audioMessage;
    if (isGroup === false || isGroup === true) {
      // Har DM/Group text/voice message par ek chhota debug marker (sirf audio ke liye chalega neeche)
    }
    if (audioContent && !isFromMe && (activeConfig.autoReplyDM || activeConfig.autoReplyGroup)) {
      const botNumber = extractNumber(sock.user.id);
      const mentionedJids = contentMsg?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      let isMentioned = mentionedJids.some(jid => extractNumber(jid) === botNumber);
      let replyParticipant = contentMsg?.extendedTextMessage?.contextInfo?.participant;
      if (replyParticipant && replyParticipant.includes('@lid')) {
        replyParticipant = await resolveLidToPn(sock, replyParticipant);
      }
      const isReplyToBot = replyParticipant && extractNumber(replyParticipant) === botNumber;

      const voiceDmAllowed = !isGroup && activeConfig.autoReplyDM;
      const voiceGroupAllowed = isGroup && activeConfig.autoReplyGroup && (isMentioned || isReplyToBot);

      console.log(`[🎙️ VOICE DEBUG] audioDetected: true | isGroup: ${isGroup} | voiceDmAllowed: ${voiceDmAllowed} | voiceGroupAllowed: ${voiceGroupAllowed}`);

      if (voiceDmAllowed || voiceGroupAllowed) {
        try {
          await sock.sendPresenceUpdate('recording', from);
          await sock.sendMessage(from, { text: '🎙️ DEBUG: Voice note detected, processing...' }, { quoted: msg });

          const { downloadMediaMessage } = require('@whiskeysockets/baileys');
          const audioBuffer = await downloadMediaMessage(
            { message: contentMsg, key: msg.key },
            'buffer',
            {},
            { logger: undefined, reuploadRequest: sock.updateMediaMessage }
          );

          await sock.sendMessage(from, { text: `🎙️ DEBUG: Audio downloaded, size: ${audioBuffer?.length || 0} bytes. Calling Gemini...` }, { quoted: msg });

          // 1 & 2. Gemini AI seedha audio samajh kar text reply deta hai (STT + AI ek sath)
          const persona = getPersona().replace(/\{name\}/g, userName);
          const replyText = await getVoiceAIReply(audioBuffer, persona);

          await sock.sendMessage(from, { text: `🎙️ DEBUG: Gemini replied: ${replyText ? replyText.slice(0, 100) : 'NULL/EMPTY'}` }, { quoted: msg });

          if (replyText) {
            // 3. Text-to-Speech (gTTS, Urdu voice)
            const voiceBuffer = await textToSpeech(replyText);

            await sock.sendMessage(from, { text: `🎙️ DEBUG: TTS buffer: ${voiceBuffer ? voiceBuffer.length + ' bytes' : 'NULL/FAILED'}` }, { quoted: msg });

            if (voiceBuffer) {
              await sock.sendMessage(from, { audio: voiceBuffer, mimetype: 'audio/mp4', ptt: true }, { quoted: msg });
            } else {
              // TTS fail ho jaye to kam az kam text reply de dein
              await sock.sendMessage(from, { text: replyText }, { quoted: msg });
            }
          }
        } catch (err) {
          console.error('Voice-to-voice error:', err);
          await sock.sendMessage(from, { text: `🎙️ DEBUG ERROR: ${err.message}\n\n${err.stack?.split('\n').slice(0,4).join('\n')}` }, { quoted: msg });
        }
      }
    }

    // ================= 1. CHATBOT FEATURE (AI Auto Reply) =================
    // DM aur Group ke liye alag alag ON/OFF (config.autoReplyDM / config.autoReplyGroup)
    // Group mein sirf tab reply karega jab bot ko tag/mention kiya ho ya reply kiya ho,
    // takay bot group mein har msg pe bol-bol na kare (spam na ho).
    if (!isFromMe) {
      const botNumber = extractNumber(sock.user.id);
      const mentionedJids = contentMsg?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      let isMentioned = mentionedJids.some(jid => extractNumber(jid) === botNumber);
      if (!isMentioned) {
        // LID format mein mention ho sakta hai, ek-ek karke resolve karo
        for (const jid of mentionedJids) {
          if (jid.includes('@lid')) {
            const resolved = await resolveLidToPn(sock, jid);
            if (extractNumber(resolved) === botNumber) { isMentioned = true; break; }
          }
        }
      }

      let replyParticipant = contentMsg?.extendedTextMessage?.contextInfo?.participant;
      if (replyParticipant && replyParticipant.includes('@lid')) {
        replyParticipant = await resolveLidToPn(sock, replyParticipant);
      }
      const isReplyToBot = replyParticipant && extractNumber(replyParticipant) === botNumber;

      if (isGroup) {
        console.log(`[🤖 DEBUG] Group msg | mentionedJids: ${JSON.stringify(mentionedJids)} | botNumber: ${botNumber} | isMentioned: ${isMentioned} | isReplyToBot: ${isReplyToBot}`);
      }

      const dmAllowed = !isGroup && activeConfig.autoReplyDM;
      const groupAllowed = isGroup && activeConfig.autoReplyGroup && (isMentioned || isReplyToBot);
      const allowedInThisChat = dmAllowed || groupAllowed;

      if (!isCmd && textMsg.length > 0 && allowedInThisChat) {
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

        let caller = normalizeJid(call.from);
        // 🔄 Agar caller ka JID LID format mein hai (@lid), to usay asal
        // phone number (PN) mein resolve karo, warna number match nahi hoga
        if (caller.includes('@lid')) {
          caller = await resolveLidToPn(sock, caller);
          caller = normalizeJid(caller);
        }
        const callerNumber = extractNumber(caller);

        console.log(`[📞 DEBUG] Raw caller: ${call.from} | Resolved: ${caller} | Extracted Number: ${callerNumber}`);

        // 🛡️ WHITELIST CHECK: config.js ki allowedCallers AUR .allowcallers command
        // se anticallManager data.json mein saved numbers, dono check honge.
        const isOwnerCaller = activeConfig.ownerNumber.includes(callerNumber);
        const isConfigAllowed = (activeConfig.allowedCallers || []).includes(callerNumber);
        const isDataAllowed = (data.allowed || []).includes(callerNumber);
        const isAllowedCaller = isConfigAllowed || isDataAllowed;

        if (isOwnerCaller || isAllowedCaller) {
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

// ================= 4. ANTI-DELETE FEATURE =================
// Jab koi message delete/revoke kare (WhatsApp "Delete for everyone"),
// yeh function cache se original message dhoond kar bot ke apne number
// (self chat) mein forward kar deta hai — text aur media (image/video/sticker) dono.
const initializeAntiDelete = (sock) => {
  sock.ev.on('messages.update', async (updates) => {
    try {
      delete require.cache[require.resolve('./config')];
      const activeConfig = require('./config');
      if (!activeConfig.antiDelete) return;

      for (const update of updates) {
        const { key, update: updData } = update;

        // Delete/Revoke detect karna
        const isRevoked = updData?.message === null || updData?.messageStubType === 1 /* REVOKE */;
        if (!isRevoked) continue;

        const msgId = key.id;
        const cached = messageStore.get(msgId);
        if (!cached) continue; // cache mein nahi mila, kuch nahi kar sakte

        // Bot ka apna number — self message destination
        const selfJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';

        const chatLabel = cached.isGroup ? `Group: ${cached.from}` : `DM`;
        const senderLabel = cached.userName ? `${cached.userName} (${extractNumber(cached.sender)})` : extractNumber(cached.sender);

        const header =
          `🗑️ *Anti-Delete Alert*\n\n` +
          `👤 *Sender:* ${senderLabel}\n` +
          `📍 *Chat:* ${chatLabel}\n` +
          `🕒 *Time:* ${new Date(cached.timestamp).toLocaleString('en-US', { timeZone: activeConfig.timezone || 'Asia/Karachi' })}\n`;

        try {
          if (cached.mediaBuffer && cached.mediaType) {
            const mediaMsgMap = {
              image: { image: cached.mediaBuffer, caption: header + (cached.text ? `\n💬 *Caption:* ${cached.text}` : '') },
              video: { video: cached.mediaBuffer, caption: header + (cached.text ? `\n💬 *Caption:* ${cached.text}` : '') },
              sticker: { sticker: cached.mediaBuffer },
              audio: { audio: cached.mediaBuffer, mimetype: cached.mediaMime || 'audio/mp4' },
              document: { document: cached.mediaBuffer, mimetype: cached.mediaMime || 'application/octet-stream' }
            };

            const payload = mediaMsgMap[cached.mediaType];
            await sock.sendMessage(selfJid, payload);

            // Sticker ka apna caption support nahi karta, is liye header alag se bhejna
            if (cached.mediaType === 'sticker') {
              await sock.sendMessage(selfJid, { text: header + (cached.text ? `\n💬 *Caption:* ${cached.text}` : '') });
            }
          } else {
            await sock.sendMessage(selfJid, {
              text: header + `\n💬 *Message:*\n${cached.text || '(empty / unsupported message type)'}`
            });
          }
        } catch (sendErr) {
          console.error('AntiDelete forward error:', sendErr.message);
        }

        // Cache se hata do, dobara forward na ho
        messageStore.delete(msgId);
      }
    } catch (err) {
   console.error('AntiDelete Error:', err);
    }
  });
};

module.exports = {
  handleMessage,
  initializeAntiCall,
  initializeAntiDelete,
  isOwner
};
