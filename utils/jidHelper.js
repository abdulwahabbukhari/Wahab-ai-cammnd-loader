const { jidDecode, jidEncode } = require('@whiskeysockets/baileys');

/**
 * Normalizes a JID, handling LID conversion and cleaning device suffixes.
 * @param {string} jid The JID to normalize.
 * @returns {string} The normalized JID.
 */
const normalizeJid = (jid) => {
    if (!jid) return jid;
    if (jid.includes('@newsletter')) return jid;
    
    try {
        const decoded = jidDecode(jid);
        if (!decoded?.user) {
            // Fallback for malformed JIDs
            return jid.split(':')[0].split('@')[0] + (jid.includes('@g.us') ? '@g.us' : '@s.whatsapp.net');
        }
        
        const user = decoded.user;
        let server = decoded.server;
        
        // Normalize server names
        if (server === 'c.us') server = 's.whatsapp.net';
        
        return jidEncode(user, server);
    } catch (error) {
        return jid;
    }
};

/**
 * Resolves a LID to a PN if possible using the socket's signal repository.
 * @param {object} sock The Baileys socket instance.
 * @param {string} jid The JID (potentially a LID) to resolve.
 * @returns {Promise<string>} The resolved PN JID or the original JID if resolution fails.
 */
const resolveLidToPn = async (sock, jid) => {
    if (!jid || !jid.includes('@lid')) return jid;
    
    try {
        if (sock.signalRepository?.lidMapping?.getPNForLID) {
            const resolvedPn = await sock.signalRepository.lidMapping.getPNForLID(jid);
            if (resolvedPn) {
                return normalizeJid(`${resolvedPn.split(':')[0]}@s.whatsapp.net`);
            }
        }
    } catch (error) {
        console.error('Error resolving LID to PN:', error);
    }
    return jid;
};

/**
 * Extracts the numeric part of a JID for owner checks.
 * @param {string} jid The JID to extract the number from.
 * @returns {string} The numeric string.
 */
const extractNumber = (jid) => {
    if (!jid) return '';
    return jid.split('@')[0].split(':')[0];
};

module.exports = {
    normalizeJid,
    resolveLidToPn,
    extractNumber
};
              
