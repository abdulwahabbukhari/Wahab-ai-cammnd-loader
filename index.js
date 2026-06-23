const express = require('express');
const pino = require('pino');
const chalk = require('chalk');
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

// =========================================================================
// 🌐 SYED-MD LIVE MULTI-USER PAIRING CODE WEB SERVER (PREMIUM UPGRADED)
// =========================================================================
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. فرنٹ اینڈ ویب سائٹ کا پریمیم انٹرفیس (Glassmorphism + Ultra Tech Aesthetic)
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SYED-MD Professional Multi-Device Pairing Portal</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;800&family=Poppins:wght@300;400;600&display=swap');
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { 
                background: radial-gradient(circle at center, #1e1b4b 0%, #0f172a 100%); 
                color: #f8fafc; 
                font-family: 'Poppins', sans-serif; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                min-height: 100vh;
                padding: 20px;
                overflow: hidden;
            }
            /* Background tech-grid effect */
            body::before {
                content: ""; position: absolute; width: 200%; height: 200%;
                background-image: linear-gradient(rgba(56, 189, 248, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 189, 248, 0.03) 1px, transparent 1px);
                background-size: 30px 30px; z-index: -1; animation: move 120s linear infinite;
            }
            @keyframes move { from { transform: translate(0,0); } to { transform: translate(-50%, -50%); } }
            
            .container { 
                background: rgba(15, 23, 42, 0.45); 
                backdrop-filter: blur(20px); 
                -webkit-backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.07);
                padding: 45px 35px; 
                border-radius: 24px; 
                width: 100%;
                max-width: 460px;
                text-align: center; 
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 40px rgba(56, 189, 248, 0.05); 
            }
            h1 { font-family: 'Orbitron', sans-serif; font-size: 32px; margin-bottom: 8px; font-weight: 800; letter-spacing: 4px; color: #38bdf8; text-shadow: 0 0 15px rgba(56, 189, 248, 0.4); }
            p { font-size: 13px; color: #94a3b8; margin-bottom: 30px; line-height: 1.6; letter-spacing: 0.5px; }
            .input-group { position: relative; margin-bottom: 25px; }
            input { 
                width: 100%; 
                padding: 16px; 
                border-radius: 12px; 
                border: 1px solid rgba(255, 255, 255, 0.1); 
                background: rgba(15, 23, 42, 0.8); 
                color: #fff; 
                font-size: 16px; 
                text-align: center; 
                outline: none;
                transition: all 0.4s ease;
                font-family: 'Orbitron', sans-serif;
                letter-spacing: 1px;
            }
            input:focus { border-color: #a855f7; box-shadow: 0 0 20px rgba(168, 85, 247, 0.25); background: rgba(15, 23, 42, 0.9); }
            button { 
                background: linear-gradient(135deg, #3b82f6, #8b5cf6); 
                color: white; 
                border: none; 
                padding: 16px; 
                width: 100%;
                font-size: 15px; 
                font-weight: 600;
                border-radius: 12px; 
                cursor: pointer; 
                transition: all 0.3s ease;
                box-shadow: 0 4px 20px rgba(139, 92, 246, 0.25);
                letter-spacing: 1px;
                text-transform: uppercase;
            }
            button:hover { background: linear-gradient(135deg, #2563eb, #7c3aed); transform: translateY(-2px); box-shadow: 0 6px 25px rgba(139, 92, 246, 0.4); }
            .footer { margin-top: 35px; font-size: 12px; color: #64748b; letter-spacing: 0.5px; }
            .footer .brand-name { 
                font-family: 'Orbitron', sans-serif;
                font-weight: 800;
                background: linear-gradient(120deg, #38bdf8, #c084fc);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                text-shadow: 0 0 10px rgba(192, 132, 252, 0.2);
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>⚡ SYED-MD ⚡</h1>
            <p>Link your device seamlessly using your phone number via secure runtime terminal.</p>
            <form action="/pair" method="POST">
                <div class="input-group">
                    <input type="text" name="number" placeholder="e.g. 923001234567" required>
                </div>
                <button type="submit">Initialize Pairing</button>
            </form>
            <div class="footer">Powered by <span class="brand-name">Syed Abdul Wahab Bukhari</span></div>
        </div>
    </body>
    </html>
    `);
});

// 2. محفوظ ملٹی یوزر پیئرنگ کوڈ جنریٹر اور ویلکم میسج ٹرگر (Isolation Method)
app.post('/pair', async (req, res) => {
    let num = req.body.number.replace(/[^0-9]/g, '');
    if (!num) {
        return res.send(`
            <body style="background:#0f172a; color:#ef4444; font-family:sans-serif; text-align:center; padding-top:100px;">
                <h2>❌ Invalid Number! Please go back and write digits only.</h2>
                <br><a href="/" style="color:#38bdf8; text-decoration:none; font-weight:bold;">← Go Back</a>
            </body>
        `);
    }

    const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
    
    // آئسولیٹڈ عارضی فولڈر سیشن پروسیسنگ کے لیے
    const tempAuthFolder = path.join(__dirname, `./temp_auth_${num}`);
    const { state } = await useMultiFileAuthState(tempAuthFolder);
    const { version } = await fetchLatestBaileysVersion();

    try {
        const tempSock = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            browser: ['Mac OS', 'Chrome', '110.0.5481.100'],
            auth: state
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

        let code = await tempSock.requestPairingCode(num);
        let formattedCode = code?.match(/.{1,4}/g)?.join('-') || code;

        // 🟢 دھماکے دار لاجک: جیسے ہی کنکشن اوپن ہو، یوزر کو ڈائریکٹ ویلکم میسج بھیجو
        tempSock.ev.on('connection.update', async (update) => {
            const { connection } = update;
            if (connection === 'open') {
                console.log(chalk.green(`🎉 [WELCOME SYSTEM] User ${num} paired successfully!`));
                
                const welcomeTemplate = `✨ *W E L C O M E  TO  S Y E D - M D* ✨\n\n` +
                                        `👋 Salam! Your device has been successfully linked to *SYED-MD Chatbot Engine*.\n\n` +
                                        `🚀 *Type:* \`.menu\` in your chat to explore all functions.\n\n` +
                                        `🛡️ _Your session is safe and completely isolated._\n` +
                                        `⚡ _Powered by Syed Abdul Wahab Bukhari_`;
                
                // یوزر کے اپنے ڈی ایم (DM) میں پہلا ویلکم میسج بھیجنا
                await tempSock.sendMessage(`${num}@s.whatsapp.net`, { text: welcomeTemplate });
            }
        });

        // کلین اپ سیشن ٹائم آؤٹ
        setTimeout(() => {
            try { fs.rmSync(tempAuthFolder, { recursive: true, force: true }); } catch (e) {}
        }, 40000);

        res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Your Security Code - SYED-MD</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;800&family=Poppins:wght@300;400;600&display=swap');
                body { background: radial-gradient(circle at center, #1e1b4b 0%, #0f172a 100%); color: #f8fafc; font-family: 'Poppins', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
                .card { background: rgba(15, 23, 42, 0.45); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.07); padding: 40px; border-radius: 24px; text-align: center; max-width: 450px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6); }
                h2 { color: #94a3b8; font-size: 15px; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600; }
                .code-display { font-family: 'Orbitron', sans-serif; background: rgba(34, 197, 94, 0.08); border: 1px solid rgba(34, 197, 94, 0.3); color: #4ade80; font-size: 32px; font-weight: bold; padding: 18px 28px; border-radius: 14px; margin: 25px 0; letter-spacing: 4px; display: inline-block; text-shadow: 0 0 10px rgba(74, 222, 128, 0.3); }
                .status-tag { color: #eab308; font-size: 12px; margin-top: -10px; margin-bottom: 20px; font-weight: 500; letter-spacing: 1px; text-transform: uppercase; }
                p { color: #94a3b8; font-size: 13px; line-height: 1.6; margin-bottom: 30px; }
                .btn-link { display: inline-block; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); padding: 12px 24px; border-radius: 10px; color: #38bdf8; text-decoration: none; font-weight: bold; font-size: 14px; transition: all 0.3s ease; }
                .btn-link:hover { background: rgba(56, 189, 248, 0.1); border-color: #38bdf8; transform: translateY(-1px); }
                .footer { margin-top: 30px; font-size: 11px; color: #64748b; font-family: 'Orbitron', sans-serif; }
            </style>
        </head>
        <body>
            <div class="card">
                <h2>Your Pairing Code Below:</h2>
                <div class="code-display">${formattedCode}</div>
                <div class="status-tag">🔄 Connected Status: Pending Pairing...</div>
                <p>Go to WhatsApp -> Linked Devices -> Link with Phone Number, and enter this security key to activate.</p>
                <a href="/" class="btn-link">← Use Another Number</a>
                <div class="footer">SYED-MD BY WAHAB BUKHARI</div>
            </div>
        </body>
        </html>
        `);

    } catch (err) {
        console.error('Web UI Pairing Error:', err.message);
        try { fs.rmSync(tempAuthFolder, { recursive: true, force: true }); } catch (e) {}
        res.send(`
            <body style="background:#0f172a; color:#ef4444; font-family:sans-serif; text-align:center; padding-top:100px;">
                <h2>❌ Error: ${err.message}</h2>
                <p style="color:#94a3b8;">Please wait 15 seconds and try again.</p>
                <br><a href="/" style="color:#38bdf8; text-decoration:none;">← Go Back</a>
            </body>
        `);
    }
});

// سرور کو لیسن موڈ پر لگانا
app.listen(PORT, () => {
    console.log(chalk.bold.green(`\n🌐 [WEB SERVER] SYED-MD UI Live on Port: ${PORT}`));
});

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

  // 2. Socket Initialization (ANTI-BAN UPDATED BROWSER)
  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ['Mac OS', 'Chrome', '110.0.5481.100'],
    auth: state,
    syncFullHistory: false,
    generateHighQualityLinkPreview: false,
    connectTimeoutMs: 60000,
    getMessage: async () => undefined 
  });

  // 3. AUTO TERMINAL LOG FOR SERVER STATUS
  if (!sock.authState.creds.registered) {
      console.log(chalk.bold.green('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
      console.log(chalk.bold.yellow('🛠️  SYED-MD MULTI-USER WEB PORTAL READIED'));
      console.log(chalk.cyan('👉 Open your cloud server domain/URL link to generate codes live.'));
      console.log(chalk.bold.green('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
  }

  // =========================================================================
  // 🛡️ SYED-MD ADVANCED ANTI-CALL INTERCEPTOR (BYPASS INTELLIGENCE)
  // =========================================================================
  sock.ev.on('call', async (callEvents) => {
    const dataPath = path.join(__dirname, './allowed_callers.json');
    let allowedCallers = [];
    
    if (fs.existsSync(dataPath)) {
        try { allowedCallers = JSON.parse(fs.readFileSync(dataPath, 'utf-8')); } catch (e) { allowedCallers = []; }
    }

    for (const call of callEvents) {
        if (call.status === 'offer') {
            const callFrom = call.from; 
            const callId = call.id;

            if (allowedCallers.includes(callFrom)) {
                console.log(chalk.green(`[CALL ALLOWED] Whitelisted member is calling: ${callFrom}`));
                continue; 
            }

            console.log(chalk.red(`[CALL BLOCKED] Unauthorized call from: ${callFrom}`));
            try {
                await sock.rejectCall(callId, callFrom);
                
                const warningCard = `⚡ 📲 *S Y E D   M D   S E C U R I T Y* 📲 ⚡\n` +
                                    `╔═════════════════════════╗\n` +
                                    `  ⚠️ *CALL DETECTED & REJECTED!*\n` +
                                    `  👤 *FROM:* @${callFrom.split('@')[0]}\n` +
                                    `  🚫 *STATUS:* Unauthorized Device\n` +
                                    `╚═════════════════════════╝\n\n` +
                                    `💡 _Note: Calling this bot is restricted. Please chat via text only._`;

                await sock.sendMessage(callFrom, { text: warningCard, mentions: [callFrom] });
            } catch (err) {
                console.error('Anti-Call Injection Error:', err.message);
            }
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
        console.log(chalk.yellow('🔄 Restarting bot to pair again...'));
        process.exit(1); 
      } else if (shouldReconnect) {
        console.log(chalk.yellow('⚠️ Disconnected. Reconnecting in 5 seconds...'));
        setTimeout(startBot, 5000);
      }
    }

    if (connection === 'open') {
      console.log(chalk.green('✅ SYED-MD Connected Successfully!'));

      const botNum = sock.user.id.split(':')[0];
      if (!config.ownerNumber.includes(botNum)) {
        config.ownerNumber.push(botNum);
        console.log(chalk.blue(`🔧 Bot number auto-added as owner: ${botNum}`));
      }
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
console.log(chalk.cyan('🚀 Starting SYED-MD Bot Framework...\n'));
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
      
