 const http = require('http');
const pino = require('pino');
const chalk = require('chalk');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const handler = require('./handler');

// =======================
// AUTO LOAD .ENV FILE
// =======================
if (fs.existsSync('./.env')) {
  const envConfig = fs.readFileSync('./.env', 'utf8').split('\n');
  envConfig.forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  });
}

// ðŸŒ KOYEB / PM2 DEPLOYMENT FIX: Dummy Server
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('WAHAB-AI Bot is Running perfectly!');
}).listen(process.env.PORT || 8080);

// =======================
// ERROR SUPPRESSION (LAG FIX)
// =======================
process.on('uncaughtException', (err) => {
    let e = String(err);
    if (e.includes('conflict') || e.includes('not-authorized') || e.includes('Socket connection timeout')) return;
    if (e.includes('Bad MAC') || e.includes('decrypt')) return;
});

process.on('unhandledRejection', (reason, promise) => {
    let r = String(reason);
    if (r.includes('Connection Closed') || r.includes('Rate Overlimit') || r.includes('Timed Out')) return;
});

const originalConsoleError = console.error;
console.error = (...args) => {
    const errorMsg = args.join(' ');
    const junkErrors = ['Bad MAC', 'Failed to decrypt', 'Session error', 'item-not-found', 'Connection reset by peer', 'ECONNRESET', 'socket hang up'];
    if (junkErrors.some(junk => errorMsg.includes(junk))) return; 
    originalConsoleError.apply(console, args);
};

// =======================
// MAIN BOT FUNCTION
// =======================
async function startBot() {
  const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
  
  const sessionFolder = `./${config.sessionName}`;
  const sessionFile = path.join(sessionFolder, 'creds.json');

  // 1. Session ID Decoding
  if (config.sessionID && config.sessionID.startsWith('ICONIC-MD~')) {
    if (!fs.existsSync(sessionFile)) {
      try {
        console.log(chalk.yellow('ðŸ”„ Loading Session ID...'));
        const b64data = config.sessionID.replace('ICONIC-MD~', '').trim();
        const decodedData = Buffer.from(b64data, 'base64').toString('utf-8');

        if (fs.existsSync(sessionFolder)) {
          fs.rmSync(sessionFolder, { recursive: true, force: true });
        }
        fs.mkdirSync(sessionFolder, { recursive: true });

        fs.writeFileSync(sessionFile, decodedData, 'utf8');
        console.log(chalk.green('âœ… Session Decoded Successfully!'));
      } catch (e) {
        console.log(chalk.red('âŒ Session Decode Error:', e.message));
      }
    }
  }

  const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);
  const { version } = await fetchLatestBaileysVersion();

  // 2. Socket Initialization
  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ['Ubuntu', 'Chrome', '20.0.04'],
    auth: state,
    syncFullHistory: false,
    generateHighQualityLinkPreview: false,
    getMessage: async () => undefined 
  });

  // 3. AUTO PAIRING CODE SYSTEM (No input required)
  if (!sock.authState.creds.registered) {
      await new Promise(r => setTimeout(r, 2000));
      console.log(chalk.bold.green('\nâ”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”'));
      console.log(chalk.bold.yellow('ðŸ› ï¸  NO SESSION DETECTED - GENERATING PAIRING CODE'));
      
      const phoneNumber = process.env.PAIRING_NUMBER;

      if (phoneNumber) {
          console.log(chalk.cyan(`ðŸ‘‰ Auto-fetching pairing code for: ${phoneNumber}`));
          try {
              const codeNum = phoneNumber.replace(/[^0-9]/g, '');
              const code = await sock.requestPairingCode(codeNum);
              console.log(chalk.bgGreen.black(' ðŸ”— PAIRING CODE: '), chalk.bold.white(` ${code} `));
              console.log(chalk.yellow('ðŸ“± Apne WhatsApp Linked Devices mein ja kar yeh code enter karein.'));
          } catch (err) {
              console.log(chalk.red('âŒ Pairing code request failed. Please check the number.'));
          }
      } else {
          console.log(chalk.red('âŒ .env file mein PAIRING_NUMBER set nahi hai!'));
          console.log(chalk.yellow('ðŸ‘‰ Bot ko rok kar .env file banayein aur usme PAIRING_NUMBER daalein.'));
      }
  }

  // =========================================================================
  // ðŸ›¡ï¸ SYED-MD ADVANCED ANTI-CALL INTERCEPTOR (BYPASS INTELLIGENCE)
  // =========================================================================
  sock.ev.on('call', async (callEvents) => {
    const dataPath = path.join(__dirname, './allowed_callers.json');
    let allowedCallers = [];
    
    // Whitelist file check & read
    if (fs.existsSync(dataPath)) {
        try { allowedCallers = JSON.parse(fs.readFileSync(dataPath, 'utf-8')); } catch (e) { allowedCallers = []; }
    }

    for (const call of callEvents) {
        if (call.status === 'offer') {
            const callFrom = call.from; 
            const callId = call.id;

            // âš¡ Ø§Ú¯Ø± Ù†Ù…Ø¨Ø± Ø§Ù„Ø§Ø¤ Ù„Ø³Ù¹ Ù…ÛŒÚº ÛÛ’ØŒ ØªÙˆ Ú©Ø§Ù„ Ú©Ùˆ Ú©Ø§Ù¹Û’ Ø¨ØºÛŒØ± ÛŒÛÛŒÚº Ø¨Ø§Ø¦ÛŒ Ù¾Ø§Ø³ (Bypass) Ú©Ø± Ø¯Ùˆ
            if (allowedCallers.includes(callFrom)) {
                console.log(chalk.green(`[CALL ALLOWED] Whitelisted member is calling: ${callFrom}`));
                continue; 
            }

            // ðŸš« Ø§Ú¯Ø± Ù†Ù…Ø¨Ø± Ø§Ù„Ø§Ø¤ Ù„Ø³Ù¹ Ù…ÛŒÚº Ù†ÛÛŒÚº ÛÛ’ØŒ ØªÙˆ Ú©Ø§Ù„ Ú©Ù¹ Ø¬Ø§Ø¦Û’ Ú¯ÛŒ
            console.log(chalk.red(`[CALL BLOCKED] Unauthorized call from: ${callFrom}`));
            try {
                await sock.rejectCall(callId, callFrom);
                
                const warningCard = `âš¡ ðŸ“² *S Y E D   M D   S E C U R I T Y* ðŸ“² âš¡\n` +
                                    `â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—\n` +
                                    `  âš ï¸ *CALL DETECTED & REJECTED!*\n` +
                                    `  ðŸ‘¤ *FROM:* @${callFrom.split('@')[0]}\n` +
                                    `  ðŸš« *STATUS:* Unauthorized Device\n` +
                                    `â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•\n\n` +
                                    `ðŸ’¡ _Note: Calling this bot is restricted. Please chat via text only._`;

                await sock.sendMessage(callFrom, { text: warningCard, mentions: [callFrom] });
            } catch (err) {
                console.error('Anti-Call Injection Error:', err.message);
            }
        }
    }
  });
  // =========================================================================

  // 4. Connection Events
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      if (statusCode === DisconnectReason.loggedOut) {
        console.log(chalk.red('âŒ Session Expired ya Logged Out!'));
        if (fs.existsSync(sessionFolder)) {
          fs.rmSync(sessionFolder, { recursive: true, force: true });
        }
        console.log(chalk.yellow('ðŸ”„ Restarting bot to pair again...'));
        process.exit(1); 
      } else if (shouldReconnect) {
        console.log(chalk.yellow('âš ï¸ Disconnected. Reconnecting in 5 seconds...'));
        setTimeout(startBot, 5000);
      }
    }

    if (connection === 'open') {
      console.log(chalk.green('âœ… WAHAB-AI Connected Successfully!'));

      const botNum = sock.user.id.split(':')[0];
      if (!config.ownerNumber.includes(botNum)) {
        config.ownerNumber.push(botNum);
        console.log(chalk.blue(`ðŸ”§ Bot number auto-added as owner: ${botNum}`));
      }

      // handler.initializeAntiCall(sock); // Ù¾Ø±Ø§Ù†Û’ Ù„ÛŒØ³Ù†Ø± Ú©Ùˆ Ú©Ù…Ù†Ù¹ Ú©Ø± Ø¯ÛŒØ§ ÛÛ’ ØªØ§Ú©Û Ù†Ø¦Û’ Ø§Ù†Ù¹Ø±Ø³ÛŒÙ¾Ù¹Ø± Ú©Û’ Ø³Ø§ØªÚ¾ Ù¹Ú©Ø±Ø§Ø¤ Ù†Û ÛÙˆ
    }
  });

  sock.ev.on('creds.update', saveCreds);

  // 5. Message Handler
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      if (!msg.message) continue;
      handler.handleMessage(sock, msg).catch(() => {});
    }
  });

  return sock;
}

// =======================
// START BOT
// =======================
console.log(chalk.cyan('ðŸš€ Starting WAHAB-AI Bot...\n'));
startBot().catch(err => {
  console.log(chalk.red('Startup Error:', err));
});

// =======================
// ðŸ§¹ SILENT RAM CLEANER
// =======================
setInterval(() => {
  try {
    if (global.gc) global.gc();
  } catch {}
}, 30 * 60 * 1000);
      
