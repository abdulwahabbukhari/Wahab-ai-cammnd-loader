/**
 * Update Command - Fetch latest code via GitHub ZIP (Owner Only)
 * Preserves runtime/state dirs: node_modules, session, tmp, temp, database, config.js
 * Optimized for obfuscation & protected against rapid multi-restarts
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const config = require('../../config');

const MAX_REDIRECTS = 5;
const DEFAULT_GITHUB_ZIP = 'https://github.com/blackdevilsyed/Wahab-ai-cammnd-loader/archive/refs/heads/main.zip';
// Global Cooldown Tracker (Memory me save rahega jab tak bot chal raha hai)
if (!global.updateCooldown) {
  global.updateCooldown = 0;
}

function run(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { windowsHide: true }, (err, stdout, stderr) => {
      if (err) return reject(new Error((stderr || stdout || err.message || '').toString()));
      resolve((stdout || '').toString());
    });
  });
}

async function extractZip(zipPath, outDir) {
  if (process.platform === 'win32') {
    const cmd = `powershell -NoProfile -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${outDir.replace(/\\/g, '/')}' -Force"`;
    await run(cmd);
    return;
  }
  try {
    await run('command -v unzip');
    await run(`unzip -o '${zipPath}' -d '${outDir}'`);
    return;
  } catch {}
  try {
    await run('command -v 7z');
    await run(`7z x -y '${zipPath}' -o'${outDir}'`);
    return;
  } catch {}
  try {
    await run('busybox unzip -h');
    await run(`busybox unzip -o '${zipPath}' -d '${outDir}'`);
    return;
  } catch {}
  throw new Error('No unzip tool found (unzip/7z/busybox). Please install one or use a panel with unzip support.');
}

function downloadFile(url, dest, visited = new Set()) {
  return new Promise((resolve, reject) => {
    try {
      if (visited.has(url) || visited.size > MAX_REDIRECTS) {
        return reject(new Error('Too many redirects'));
      }
      visited.add(url);

      const client = url.startsWith('https://') ? https : http;
      const req = client.get(url, {
        headers: {
          'User-Agent': 'Qadeer-Xtech-Updater/1.0',
          'Accept': '*/*'
        }
      }, res => {
        if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
          const location = res.headers.location;
          if (!location) return reject(new Error('HTTP Redirect without Location'));
          const nextUrl = new URL(location, url).toString();
          res.resume();
          return downloadFile(nextUrl, dest, visited).then(resolve).catch(reject);
        }

        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}`));
        }

        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => file.close(resolve));
        file.on('error', err => {
          try { file.close(() => {}); } catch {}
          fs.unlink(dest, () => reject(err));
        });
      });
      req.on('error', err => {
        fs.unlink(dest, () => reject(err));
      });
    } catch (e) {
      reject(e);
    }
  });
}

function copyRecursive(src, dest, ignore = [], relative = '', outList = []) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    if (ignore.includes(entry)) continue;
    const s = path.join(src, entry);
    const d = path.join(dest, entry);
    const stat = fs.lstatSync(s);
    if (stat.isDirectory()) {
      copyRecursive(s, d, ignore, path.join(relative, entry), outList);
    } else {
      fs.copyFileSync(s, d);
      if (outList) outList.push(path.join(relative, entry).replace(/\\/g, '/'));
    }
  }
}

async function updateViaZip(zipUrl) {
  const tmpDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  const zipPath = path.join(tmpDir, 'update.zip');
  const extractTo = path.join(tmpDir, 'update_extract');

  await downloadFile(zipUrl, zipPath);

  if (fs.existsSync(extractTo)) fs.rmSync(extractTo, { recursive: true, force: true });
  await extractZip(zipPath, extractTo);

  const entries = fs.readdirSync(extractTo);
  const rootCandidate = entries.length === 1 ? path.join(extractTo, entries[0]) : extractTo;
  const srcRoot = fs.existsSync(rootCandidate) && fs.lstatSync(rootCandidate).isDirectory() ? rootCandidate : extractTo;

  const ignore = [
    'node_modules',
    '.git',
    'session',
    'tmp',
    'temp',
    'database',
    'config.js'
  ];
  const copied = [];
  copyRecursive(srcRoot, process.cwd(), ignore, '', copied);

  try { fs.rmSync(extractTo, { recursive: true, force: true }); } catch {}
  try { fs.rmSync(zipPath, { force: true }); } catch {}

  return { copiedFiles: copied };
}

module.exports = {
  name: 'update',
  aliases: ['upgrade', 'sync'],
  category: 'owner',
  description: 'Update bot from GitHub repository via ZIP (Owner Only)',
  usage: '.update [optional_zip_url]',
  ownerOnly: true,

  async execute(sock, msg, args, extra) {
    const chatId = msg.key.remoteJid;
    const currentTime = Date.now();
    
    // 60000 milliseconds = 1 minute cooldown check
    if (currentTime - global.updateCooldown < 60000) {
      const remaining = Math.ceil((60000 - (currentTime - global.updateCooldown)) / 1000);
      return extra.reply(`❌ System is already updated and running on the latest version. Please wait ${remaining} seconds before checking again to prevent panel crash.`);
    }

    const zipUrl = (args[0] || config.updateZipUrl || process.env.UPDATE_ZIP_URL || DEFAULT_GITHUB_ZIP).trim();

    try {
      await extra.reply(`🔄 Fetching latest updates from private system...`);

      const { copiedFiles } = await updateViaZip(zipUrl);

      // Cooldown timestamp update taa ke immediately dobara run na ho sake
      global.updateCooldown = Date.now();

      if (copiedFiles.length === 0) {
        return await sock.sendMessage(chatId, { 
          text: `✅ Update check complete. Everything is already up-to-date with GitHub.` 
        }, { quoted: msg });
      }

      await sock.sendMessage(chatId, { 
        text: `✅ Update complete! Total files updated: ${copiedFiles.length}

🔄 Restarting the bot safely via PM2...` 
      }, { quoted: msg });

      try {
        await run('pm2 restart all');
        return;
      } catch {
        setTimeout(() => process.exit(0), 1000);
      }
      
    } catch (error) {
      console.error('Update failed:', error);
      await sock.sendMessage(chatId, { 
        text: `❌ Update failed:
${String(error.message || error)}` 
      }, { quoted: msg });
    }
  }
};
