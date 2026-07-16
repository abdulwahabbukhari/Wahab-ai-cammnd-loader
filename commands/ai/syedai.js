const axios = require('axios');

module.exports = {
name: 'syedai',
aliases: ['hackerai'],
category: 'ai',
description: 'Chat with Syed Hacker AI',

async execute(sock, msg, args, { from, reply }) {
try {
if (args.length === 0) {
return reply(
'❌ Usage: .syedai <question>\n\nExample: .syedai who built you?'
);
}

  const query = args.join(' ');

  // Typing status
  await sock.sendPresenceUpdate('composing', from);

  const response = await axios.get(
    `https://syed-api-53a5633be6cf.herokuapp.com/nasa?prompt=${encodeURIComponent(query)}`
  );

  if (response.data.success && response.data.response) {
    return reply(
      `😈 *Syed Hacker AI*\n\n${response.data.response}`
    );
  } else {
    return reply('❌ Failed to get response from Syed AI');
  }

} catch (error) {
  console.error('Syed AI Command Error:', error.message);
  return reply(`❌ Error: ${error.message}`);
}

}
};
