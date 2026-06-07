module.exports = {
    // Bot Owner Configuration
    ownerNumber: ['923376539373','923049730127'],
    ownerName: ['SYED ABDUL WAHAB BUKHARI', 'SYED-HACKER'],
    
    // Bot Configuration
    botName: 'SYED MD',
    version: '1.0.0',
    prefix: '.',

    // 🔔 CHANNEL / NEWSLETTER CONFIG
    channelId: '120363426863283917@newsletter',

    sessionName: 'session',
    sessionID: process.env.SESSION_ID || '',
    
    selfMode: true,
    autoReply: false,

    messages: {
      wait: '⏳ Please wait...',
      success: '✅ Success!',
      error: '❌ Error occurred!',
      ownerOnly: '👑 This command is only for bot owner!'
    },

    timezone: 'Asia/Karachi'
};
