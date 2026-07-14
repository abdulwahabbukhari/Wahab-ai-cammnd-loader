const { normalizeJid, resolveLidToPn, extractNumber } = require('./jidHelper');

/**
 * Group ke participants list mein se ek target number (PN) ko robust tareeqe
 * se dhoondti hai — chahe participant ka ID normal PN format mein ho ya @lid
 * format mein. Isay saari group-commands (kick/promote/demote/add) use karti
 * hain taake JID/LID detection har jagah 100% consistent rahe.
 *
 * @param {object} sock Baileys socket
 * @param {Array} participants groupMetadata.participants array
 * @param {string} targetNumber jis number ko dhoondna hai (extractNumber wala format)
 * @returns {Promise<object|null>} matching participant object ya null
 */
async function findParticipant(sock, participants, targetNumber) {
  // 1. Direct match (participant ID already PN format mein hai)
  let found = participants.find(p => extractNumber(p.id) === targetNumber);
  if (found) return found;

  // 2. LID format participants ko resolve karke match karo
  for (const p of participants) {
    if (p.id.includes('@lid')) {
      try {
        const resolved = await resolveLidToPn(sock, p.id);
        if (extractNumber(resolved) === targetNumber) return p;
      } catch (_) { /* skip, try next */ }
    }
  }

  return null;
}

/**
 * Bot khud group mein admin (ya superadmin/creator) hai ya nahi, yeh
 * robust tareeqe se check karti hai — LID-safe.
 *
 * @param {object} sock Baileys socket
 * @param {object} groupMetadata sock.groupMetadata() ka result
 * @returns {Promise<{isAdmin: boolean, botNumber: string, botParticipant: object|null}>}
 */
async function checkBotAdmin(sock, groupMetadata) {
  const botJid = normalizeJid(sock.user.id);
  const botNumber = extractNumber(botJid);

  const botParticipant = await findParticipant(sock, groupMetadata.participants, botNumber);

  const isAdmin = !!botParticipant && ['admin', 'superadmin'].includes(botParticipant.admin);

  return { isAdmin, botNumber, botParticipant };
}

/**
 * Message context (mention / reply / raw argument) se target JID nikaalti
 * hai, LID ko resolve karke normalize karti hai. Har group-command isay
 * use karegi taake target-detection consistent rahe.
 *
 * @param {object} sock Baileys socket
 * @param {object} msg raw message object
 * @param {Array} args command ke args
 * @returns {Promise<string|null>} normalized target JID ya null
 */
async function resolveTargetJid(sock, msg, args) {
  const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
  let targetJid = contextInfo?.mentionedJid?.[0] || contextInfo?.participant;

  if (!targetJid && args[0]) {
    const num = args[0].replace(/[^0-9]/g, '');
    if (num) targetJid = `${num}@s.whatsapp.net`;
  }

  if (!targetJid) return null;

  if (targetJid.includes('@lid')) {
    targetJid = await resolveLidToPn(sock, targetJid);
  }

  return normalizeJid(targetJid);
}

module.exports = {
  findParticipant,
  checkBotAdmin,
  resolveTargetJid
};
