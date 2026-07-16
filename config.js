module.exports = {
    // Bot Owner Configuration
    ownerNumber: ['923376539373','923049730127'],
    ownerName: ['SYED ABDUL WAHAB BUKHARI', 'SYED-HACKER'],    
    
    // Bot Configuration
    botName: 'SYED MD',
    version: '1.0.0',
    prefix: '.',

    // 🚀 NOPREFIX MODE
    // true  = commands bina '.' prefix ke bhi chalengi (e.g. "menu" instead of ".menu")
    // false = sirf prefix wale commands chalenge (e.g. ".menu")
    noprefix: false,

    // 🛡️ ALLOWED CALLERS (Anticall Whitelist)
    // In numbers ki calls ANTICALL system ignore kar dega (reject/block nahi hoga)
    // Number format: country code + number, bina '+' ya spaces ke (jaise ownerNumber wala format)
    allowedCallers: [
        // '923001234567',
    ],

    // 🗑️ ANTI-DELETE
    // true  = koi bhi deleted message (text/image/video/sticker) bot ke apne number
    //         par (self chat) forward ho jayega — DM aur Groups dono mein
    // false = anti-delete feature bandh
    antiDelete: true,

    channelId: '120363426863283917@newsletter',

    sessionName: 'session',
    sessionID: process.env.SESSION_ID || '',
    
    selfMode: true,
    // 🤖 AI AUTO-REPLY (Chatbot) — DM aur Group ke liye alag control
    // .chatbot on dms / .chatbot off dms  -> DM control
    // .chatbot on gc  / .chatbot off gc   -> Group control
    autoReplyDM: false,
    autoReplyGroup: false,

    // 🎙️ VOICE-TO-VOICE CHATBOT (automatically follows .chatbot on/off dms/gc — koi alag command nahi)
    // true  = voice note ka jawab bhi voice note mein milega (Gemini AI + gTTS)
    voiceChatbotDM: false,
    voiceChatbotGroup: false,

    messages: {
      wait: '⏳ Please wait...',
      success: '✅ Success!',
      error: '❌ Error occurred!',
      ownerOnly: '👑 This command is only for bot owner!'
    },

    timezone: 'Asia/Karachi'
};
