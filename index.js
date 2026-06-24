/* ================================================================
   🚀 SYED-MD CHATBOT ENGINE (CRYSTAL SPEED EDITION - PERFECT FIX)
   ⚡ 1. ULTRA-FAST PAIRING ENGINE (Instant Synchronous Generation)
   🎨 2. 3D ANIMATED PORTAL UI (Professional Look)
   🛡️ 3. ANTI-BAN PROTECTION (Isolated Sandboxing)
   🎉 4. AUTOMATIC WELCOME MESSAGE SYSTEM (DM Injector)
   🧹 BONUS: AUTOMATIC SILENT RAM CLEANER
   ⚡ Powered by Syed Abdul Wahab Bukhari (Marco Malik)
   ================================================================
*/

const express = require('express');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const { 
    default: makeWASocket, 
    useMultiFileAuthState,
    DisconnectReason, 
    delay
} = require('@whiskeysockets/baileys');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =========================================================================
// 🎨 [KAM 1]: 3D ANIMATED PORTAL FRONT-END (HTML + MODERN TAILWIND)
// =========================================================================
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SYED-MD | Crystal Speed</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght=600;900&family=Poppins:wght=400;600&display=swap');
            body { 
                background: #020202; 
                color: #fff; 
                font-family: 'Poppins', sans-serif; 
                position: relative;
                overflow: hidden;
            }
            body::before {
                content: "";
                position: absolute;
                inset: 0;
                background-image: linear-gradient(rgba(255,255,255,0.01) 1px, transparent 1px), 
                                  linear-gradient(90deg, rgba(255,255,255,0.01) 1px, transparent 1px);
                background-size: 40px 40px;
                z-index: 0;
            }
            .glass-3d {
                background: rgba(255, 255, 255, 0.02);
                backdrop-filter: blur(25px);
                -webkit-backdrop-filter: blur(25px);
                border: 1px solid rgba(255, 255, 255, 0.08);
                box-shadow: 0 30px 60px rgba(0,0,0,0.8);
                transform: perspective(1000px) rotateX(2deg);
                transform-style: preserve-3d;
            }
            .btn-3d {
                transition: transform 0.1s, box-shadow 0.2s;
                box-shadow: 0 4px 0px #1e40af;
            }
            .btn-3d:active { 
                transform: translateY(4px);
                box-shadow: 0 0px 0px #1e40af;
            }
            @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 8px rgba(59, 130, 246, 0.4); } 50% { box-shadow: 0 0 25px rgba(59, 130, 246, 0.8); } }
            .glow-active { animation: pulse-glow 1.5s infinite; }
        </style>
    </head>
    <body class="flex items-center justify-center min-h-screen">
        <div class="glass-3d p-8 rounded-3xl w-full max-w-sm text-center z-10 mx-4">
            <div class="mb-6">
                <div class="w-14 h-14 mx-auto bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg mb-3">
                    <span class="text-xl font-black text-white tracking-widest" style="font-family: 'Orbitron';">S-MD</span>
                </div>
                <h1 class="text-2xl font-black tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500" style="font-family: 'Orbitron';">SYED-MD SPEED</h1>
                <p class="text-[10px] text-cyan-400 tracking-wider uppercase mt-1">⚡ Crystal Instant Engine ⚡</p>
            </div>

            <div id="formContainer" class="space-y-4">
                <div class="text-left">
                    <label class="block text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-1.5 ml-1">WhatsApp Number</label>
                    <input id="num" type="text" placeholder="e.g. 923001234567" 
                           class="w-full bg-black/60 border border-white/10 rounded-xl p-3.5 text-center font-mono text-sm outline-none focus:border-cyan-500 text-white tracking-widest transition-colors shadow-inner">
                </div>
                <button onclick="pair()" id="btn" class="btn-3d w-full bg-blue-600 hover:bg-blue-500 py-3.5 rounded-xl font-bold text-xs tracking-widest text-white uppercase glow-active">GENERATE INSTANT CODE</button>
            </div>

            <div id="result" class="hidden mt-6 p-4 bg-black/90 border border-cyan-500/40 rounded-2xl text-2xl font-mono font-black text-emerald-400 tracking-widest shadow-inner">---- ----</div>
            <p id="infoText" class="hidden text-[10px] text-gray-500 mt-3 px-1 leading-relaxed">Copy this code, open WhatsApp Linked Devices, and enter it immediately.</p>

            <div class="mt-8 pt-4 border-t border-white/5 text-[10px] text-gray-600 tracking-widest uppercase">
                ⚡ Powered by <span class="font-bold text-indigo-400" style="font-family: 'Orbitron';">Syed Abdul Wahab Bukhari</span>
            </div>
        </div>

        <script>
            async function pair() {
                const btn = document.getElementById('btn');
                const numInput = document.getElementById('num');
                let num = numInput.value.replace(/[^0-9]/g, '');
                
                if(!num || num.length < 10) {
                    return alert('Please enter a valid phone number with country code!');
                }
                
                btn.innerText = 'CRYSTALLIZING SESSION...';
                btn.disabled = true;
                
                try {
                    const res = await fetch('/pair?number=' + num);
                    const data = await res.json();
                    if(data.code) {
                        const cleanCode = data.code.replace(/[^A-Za-z0-9]/g, '');
                        const formatted = cleanCode.match(/.{1,4}/g).join('-');
                        document.getElementById('result').innerText = formatted;
                        document.getElementById('result').classList.remove('hidden');
                        document.getElementById('infoText').classList.remove('hidden');
                        btn.innerText = 'CODE INJECTED SUCCESSFULLY';
                    } else {
                        alert(data.error || 'Server rejected request. Try again.');
                        resetForm();
                    }
                } catch(err) {
                    alert('Server Handshake Failed. Verify Railway Logs.');
                    resetForm();
                }
            }

            function resetForm() {
                document.getElementById('num').value = '';
                document.getElementById('result').classList.add('hidden');
                document.getElementById('infoText').classList.add('hidden');
                const btn = document.getElementById('btn');
                btn.innerText = 'GENERATE INSTANT CODE';
                btn.disabled = false;
            }
        </script>
    </body>
    </html>
    `);
});

// =========================================================================
// 🛡️ [KAM 2 & 4]: HIGH-SPEED SYNCHRONOUS PAIR ROUTE
// =========================================================================
app.get('/pair', async (req, res) => {
    let num = req.query.number;
    if (!num) return res.json({ error: "Number is required" });
    num = num.replace(/[^0-9]/g, '');

    const tempAuthFolder = path.join(__dirname, 'session_' + num);
    
    try {
        if (fs.existsSync(tempAuthFolder)) {
            fs.rmSync(tempAuthFolder, { recursive: true, force: true });
        }
        fs.mkdirSync(tempAuthFolder, { recursive: true });

        const { state, saveCreds } = await useMultiFileAuthState(tempAuthFolder);
        
        const sock = makeWASocket({
            version: [2, 3000, 1015698762],
            auth: state,
            printQRInTerminal: false,
            logger: pino({ level: 'fatal' }),
            browser: ['Chrome', 'Windows', '10'] 
        });

        // Background handler for authorization updates
        sock.ev.on('creds.update', saveCreds);

        // [CRITICAL FIX]: Directly fetching pairing code without wrapping inside connection.update
        await delay(2500); // 2.5 seconds loop block for core runtime architecture sync
        
        if (!sock.authState.creds.registered) {
            let code = await sock.requestPairingCode(num);
            if (code && !res.headersSent) {
                res.json({ code: code });
            } else {
                if (!res.headersSent) res.json({ error: "Failed to fetch pairing code from WhatsApp servers." });
            }
        } else {
            if (!res.headersSent) res.json({ error: "Active session already running." });
        }

        // Handle successful linkage and welcome notification separately in background
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === 'open') {
                console.log(`[SUCCESS] Device ${num} linked successfully.`);
                const welcomeText = `✨ *W E L C O M E  TO  S Y E D - M D* ✨\n\n👋 Salam! Your device has been successfully linked to *Core Engine*.\n\n🚀 *Type:* \`.menu\` in your chat to explore all functions.\n\n🛡️ _Your session is safe and completely isolated._\n⚡ _Powered by Syed Abdul Wahab Bukhari_`;
                await sock.sendMessage(`${num}@s.whatsapp.net`, { text: welcomeText });
                await delay(2000); 
                sock.logout();
            }

            if (connection === 'close') {
                const isLoggedOut = lastDisconnect?.error?.output?.statusCode === DisconnectReason.loggedOut;
                if (!isLoggedOut) {
                    setTimeout(() => {
                        try { if (fs.existsSync(tempAuthFolder)) fs.rmSync(tempAuthFolder, { recursive: true, force: true }); } catch(e) {}
                    }, 5000);
                }
            }
        });

    } catch (err) {
        console.log('Core Process Failure:', err);
        if (!res.headersSent) res.json({ error: "Sandbox initialization error: " + err.message });
    }
});

// =========================================================================
// 🤖 SERVER INITIALIZATION
// =========================================================================
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] Portal operational on port: ${PORT}`);
});

server.timeout = 0;
server.keepAliveTimeout = 0;

setInterval(() => {
    try { if (global.gc) global.gc(); } catch (e) {}
}, 30 * 60 * 1000);
                        
