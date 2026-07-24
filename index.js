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

// 🌐 KOYEB / PM2 DEPLOYMENT FIX: Dummy Server
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
    const junkErrors = [
        'Bad MAC',
        'Failed to decrypt',
        'Session error',
        'item-not-found',
        'Connection reset by peer',
        'ECONNRESET',
        'socket hang up'
    ];
    if (junkErrors.some(junk => errorMsg.includes(junk))) return;
    originalConsoleError.apply(console, args);
};

// =======================
// MAIN BOT FUNCTION
// =======================
async function startBot() {
  const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeInMemoryStore
  } = require('@whiskeysockets/baileys');

  const sessionFolder = `./${config.sessionName}`;
  const sessionFile = path.join(sessionFolder, 'creds.json');

  // ──────────────────────────────────────────────
  // 1. Session ID Decoding (Base64 Session Load)
  // ──────────────────────────────────────────────
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

  // ──────────────────────────────────────────────
  // 2. In-Memory Store (contacts/chats — broadcast jaisi commands ke liye)
  // ──────────────────────────────────────────────
  const storeFile = path.join(sessionFolder, 'baileys_store.json');
  const store = makeInMemoryStore({ logger: pino({ level: 'silent' }) });
  try {
    if (fs.existsSync(storeFile)) store.readFromFile(storeFile);
  } catch (e) {
    console.log(chalk.yellow('⚠️ Store file read error (ignored):', e.message));
  }
  setInterval(() => {
    try { store.writeToFile(storeFile); } catch (e) {}
  }, 10_000);

  // ──────────────────────────────────────────────
  // 3. Socket Initialization
  // ──────────────────────────────────────────────
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

  store.bind(sock.ev);
  sock.store = store; // Commands (jaise broadcast.js) sock.store se contacts access karte hain

  // ──────────────────────────────────────────────
  // 4. AUTO PAIRING CODE LOGIN SYSTEM
  // ──────────────────────────────────────────────
  if (!sock.authState.creds.registered) {
    await new Promise(r => setTimeout(r, 2000));

    console.log(chalk.bold.green('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.bold.yellow('🛠️  NO SESSION DETECTED — GENERATING PAIRING CODE'));

    const phoneNumber = process.env.PAIRING_NUMBER;

    if (phoneNumber) {
      console.log(chalk.cyan(`👉 Auto-fetching pairing code for: ${phoneNumber}`));
      try {
        const codeNum = phoneNumber.replace(/[^0-9]/g, '');
        const code = await sock.requestPairingCode(codeNum);
        console.log(chalk.bgGreen.black(' 🔗 PAIRING CODE: '), chalk.bold.white(` ${code} `));
        console.log(chalk.yellow('📱 Apne WhatsApp Linked Devices mein ja kar yeh code enter karein.'));
        console.log(chalk.yellow('📱 WhatsApp > Settings > Linked Devices > Link a Device'));
      } catch (err) {
        console.log(chalk.red('❌ Pairing code request failed. Please check the number.'));
        console.log(chalk.red(`   Error: ${err.message}`));
      }
    } else {
      console.log(chalk.red('❌ .env file mein PAIRING_NUMBER set nahi hai!'));
      console.log(chalk.yellow('👉 Bot ko rok kar .env file banayein aur usme PAIRING_NUMBER daalein.'));
      console.log(chalk.yellow('   Example: PAIRING_NUMBER=923001234567'));
    }
  }

  // ──────────────────────────────────────────────
  // 5. Connection Events
  // ──────────────────────────────────────────────
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
        console.log(chalk.yellow('🔄 Restarting bot to pair again...'));
        process.exit(1);
      } else if (shouldReconnect) {
        console.log(chalk.yellow('⚠️ Disconnected. Reconnecting in 5 seconds...'));
        setTimeout(startBot, 5000);
      }
    }

    if (connection === 'open') {
      console.log(chalk.green('✅ WAHAB-AI Connected Successfully!'));

      // Auto-add bot number as owner
      const botNum = sock.user.id.split(':')[0];
      if (!config.ownerNumber.includes(botNum)) {
        config.ownerNumber.push(botNum);
        console.log(chalk.blue(`🔧 Bot number auto-added as owner: ${botNum}`));
      }

      // Initialize handlers
      handler.initializeAntiCall(sock);
      handler.initializeAntiDelete(sock);
    }
  });

  sock.ev.on('creds.update', saveCreds);

  // ──────────────────────────────────────────────
  // 6. Message Handler
  // ──────────────────────────────────────────────
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
console.log(chalk.cyan('🚀 Starting WAHAB-AI Bot...\n'));
startBot().catch(err => {
  console.log(chalk.red('Startup Error:', err));
});

// =======================
// 🧹 SILENT RAM CLEANER
// =======================
setInterval(() => {
  try {
    if (global.gc) global.gc();
  } catch {}
}, 30 * 60 * 1000);
                    
