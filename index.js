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

// KOYEB / PM2 DEPLOYMENT FIX: Dummy Server
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
        console.log(chalk.yellow('🔄 Loading Session ID...'));
        const b64data = config.sessionID.replace('ICONIC-MD~', '').trim();
        const decodedData = Buffer.from(b64data, 'base64').toString('utf-8');

        if (fs.existsSync(sessionFolder)) {
          fs.rmSync(sessionFolder, { recursive: true, force: true });
        }
        fs.mkdirSync(sessionFolder, { recursive: true });

        fs.writeFileSync(sessionFile, decodedData, 'utf8');
        console.log(chalk.green('✅ Session Decoded Successfully!'));
      } catch (e) {
        console.log(chalk.red('❌ Session Decode Error:', e.message));
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

  // 3. AUTO PAIRING CODE SYSTEM
  if (!sock.authState.creds.registered) {
      await new Promise(r => setTimeout(r, 2000));
      console.log(chalk.bold.green('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
      console.log(chalk.bold.yellow('🛠️  NO SESSION DETECTED - GENERATING PAIRING CODE'));
      
      const phoneNumber = process.env.PAIRING_NUMBER;

      if (phoneNumber) {
          console.log(chalk.cyan(`👉 Auto-fetching pairing code for: ${phoneNumber}`));
          try {
              const codeNum = phoneNumber.replace(/[^0-9]/g, '');
              const code = await sock.requestPairingCode(codeNum);
              console.log(chalk.bgGreen.black(' 🔗 PAIRING CODE: '), chalk.bold.white(` ${code} `));
          } catch (err) {
              console.log(chalk.red('❌ Pairing code request failed.'));
          }
      } else {
          console.log(chalk.red('❌ .env file mein PAIRING_NUMBER set nahi hai!'));
      }
  }

  // =========================================================================
  // 🛡️ ANTI-CALL INTEGRATION WITH WHITELIST LOGIC
  // =========================================================================
  sock.ev.on('call', async (callEvents) => {
    const dataPath = path.join(__dirname, './allowed_callers.json');
    let allowedCallers = [];
    
    // Whitelist file checking
    if (fs.existsSync(dataPath)) {
        try { allowedCallers = JSON.parse(fs.readFileSync(dataPath, 'utf-8')); } catch (e) { allowedCallers = []; }
    }

    for (const call of callEvents) {
        if (call.status === 'offer') {
            const callFrom = call.from; 
            
            // Agar number whitelist mein hai, toh yahan se bypass (continue) karo
            if (allowedCallers.includes(callFrom)) {
                console.log(chalk.green(`[CALL ALLOWED] Whitelisted member is calling: ${callFrom}`));
                continue; 
            }

            // Agar whitelist mein nahi hai, toh yeh event handler.js sambhalega (Jo ke warnings count karega)
        }
    }
  });

  // 4. Connection Events
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      if (statusCode === DisconnectReason.loggedOut) {
        console.log(chalk.red('❌ Session Expired ya Logged Out!'));
        if (fs.existsSync(sessionFolder)) {
          fs.rmSync(sessionFolder, { recursive: true, force: true });
        }
        process.exit(1); 
      } else if (shouldReconnect) {
        console.log(chalk.yellow('⚠️ Disconnected. Reconnecting in 5 seconds...'));
        setTimeout(startBot, 5000);
      }
    }

    if (connection === 'open') {
      console.log(chalk.green('✅ WAHAB-AI Connected Successfully!'));

      const botNum = sock.user.id.split(':')[0];
      if (!config.ownerNumber.includes(botNum)) {
        config.ownerNumber.push(botNum);
      }

      // Handler ka real warning system active karne ki important line
      handler.initializeAntiCall(sock); 
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

// START BOT
console.log(chalk.cyan('🚀 Starting WAHAB-AI Bot...\n'));
startBot().catch(err => {
  console.log(chalk.red('Startup Error:', err));
});

// RAM CLEANER
setInterval(() => {
  try {
    if (global.gc) global.gc();
  } catch {}
}, 30 * 60 * 1000);
      
