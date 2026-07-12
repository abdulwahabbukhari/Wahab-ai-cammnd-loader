/**
 * PATCH: Baileys profilePictureUrl Fix
 * ──────────────────────────────────────
 * WhatsApp ne recent update mein profilePictureUrl ko break kar diya hai.
 * Yeh script aap ke node_modules mein Baileys ka internal function patch karti hai.
 * 
 * SETUP INSTRUCTIONS:
 * ──────────────────
 * Apni bot ki main entry file (index.js ya app.js) mein, Baileys initialize
 * karne se PEHLE yeh line add karein:
 * 
 *   require('./patchProfilePicture')();
 * 
 * Ya agar Baileys ko require karne se pehle karna hai to:
 *   require('@whiskeysockets/baileys');
 *   require('./patchProfilePicture')();
 */

function patchProfilePicture() {
  try {
    const path = require('path');
    const fs = require('fs');

    // chats.js file ka path nikalo
    const baileysPath = require.resolve('@whiskeysockets/baileys');
    const chatsFile = path.join(path.dirname(baileysPath), '..', 'Socket', 'chats.js');

    // Check karo ke file exist karti hai
    if (!fs.existsSync(chatsFile)) {
      console.warn('[PP-Patch] chats.js not found at expected path:', chatsFile);
      return false;
    }

    // File read karo
    let content = fs.readFileSync(chatsFile, 'utf-8');

    // Check karo ke patch already applied hai ya nahi
    if (content.includes('__PATCHED_PP_URL__')) {
      console.log('[PP-Patch] ProfilePictureUrl already patched.');
      return true;
    }

    // Custom profilePictureUrl function define karo
    const patchFunction = `
    // __PATCHED_PP_URL__ — Fixed by getpp command
    // Original WhatsApp query structure se directly fetch
    const profilePictureUrl = async (jid, type = 'preview', timeoutMs) => {
        var _a;
        jid = (0, WABinary_1.jidNormalizedUser)(jid);
        const result = await query({
            tag: 'iq',
            attrs: {
                target: jid,
                to: WABinary_1.S_WHATSAPP_NET,
                type: 'get',
                xmlns: 'w:profile:picture'
            },
            content: [
                { tag: 'picture', attrs: { type, query: 'url' } }
            ]
        }, timeoutMs);
        const child = (0, WABinary_1.getBinaryNodeChild)(result, 'picture');
        return (_a = child === null || child === void 0 ? void 0 : child.attrs) === null || _a === void 0 ? void 0 : _a.url;
    };
    Object.defineProperty(exports, "profilePictureUrl", {
        enumerable: true,
        get: function () { return profilePictureUrl; }
    });
    // __PATCHED_PP_URL__
`;

    // Old profilePictureUrl ko replace karo
    // Pattern: const profilePictureUrl = async (jid, type = 'preview', timeoutMs) => { ...
    const oldPattern = /const profilePictureUrl = async \(jid,\s*type\s*=\s*['"]preview['"],\s*timeoutMs?\)/g;
    const match = oldPattern.exec(content);

    if (match) {
      const startIdx = match.index;
      // Closing bracket tak jaakar replace karo
      // Simple approach: next 500 characters mein function body hai
      const endIndex = content.indexOf('\n    }, timeoutMs);\n', startIdx);

      if (endIndex !== -1) {
        // Old function ko patchFunction se replace karo
        const newContent = content.slice(0, startIdx) + patchFunction + content.slice(endIndex + '\n    }, timeoutMs);\n'.length);
        fs.writeFileSync(chatsFile, newContent, 'utf-8');
        console.log('[PP-Patch] ✅ ProfilePictureUrl successfully patched!');
        return true;
      }
    }

    // Agar pattern match na ho to alternative approach
    console.warn('[PP-Patch] Could not find exact pattern to patch. Manual patch may be needed.');
    return false;

  } catch (err) {
    console.error('[PP-Patch] Error:', err.message);
    return false;
  }
}

module.exports = patchProfilePicture;
