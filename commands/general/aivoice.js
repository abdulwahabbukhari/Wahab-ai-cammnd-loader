const axios = require('axios');

module.exports = {
  name: 'aivoice',
  aliases: ['vai', 'voicex', 'voiceai'],
  category: 'general',
  description: 'Text to speech with different AI voices',
  usage: '.aivoice <text>',

  async execute(sock, msg, args, extra) {
    try {
      if (!args[0]) {
        return extra.reply('Please provide text after the command.\nExample: .aivoice hello');
      }

      const inputText = args.join(' ');
      const from = extra.from;

      // Voice model menu
      const voiceModels = [
        { number: '1', name: 'Hatsune Miku', model: 'miku' },
        { number: '2', name: 'Nahida (Exclusive)', model: 'nahida' },
        { number: '3', name: 'Nami', model: 'nami' },
        { number: '4', name: 'Ana (Female)', model: 'ana' },
        { number: '5', name: 'Optimus Prime', model: 'optimus_prime' },
        { number: '6', name: 'Goku', model: 'goku' },
        { number: '7', name: 'Taylor Swift', model: 'taylor_swift' },
        { number: '8', name: 'Elon Musk', model: 'elon_musk' },
        { number: '9', name: 'Mickey Mouse', model: 'mickey_mouse' },
        { number: '10', name: 'Kendrick Lamar', model: 'kendrick_lamar' },
        { number: '11', name: 'Angela Adkinsh', model: 'angela_adkinsh' },
        { number: '12', name: 'Eminem', model: 'eminem' }
      ];

      // Create menu text
      let menuText = '╭━━━〔 *AI VOICE MODELS* 〕━━━⊷\n';
      voiceModels.forEach(model => {
        menuText += `┃▸ ${model.number}. ${model.name}\n`;
      });
      menuText += '╰━━━⪼\n\n';
      menuText += `📌 *Reply with the number to select voice model for:*\n"${inputText}"`;

      // Send menu message with image
      const sentMsg = await sock.sendMessage(from, {
        image: { url: 'https://files.catbox.moe/7b72td.jpg' },
        caption: menuText
      }, { quoted: msg });

      const messageID = sentMsg.key.id;
      let handlerActive = true;

      // Set timeout to remove handler after 2 minutes
      const handlerTimeout = setTimeout(() => {
        handlerActive = false;
        sock.ev.off('messages.upsert', messageHandler);
        extra.reply('⌛ Voice selection timed out. Please try the command again.');
      }, 120000);

      // Message handler function
      const messageHandler = async (msgData) => {
        if (!handlerActive) return;

        const receivedMsg = msgData.messages[0];
        if (!receivedMsg || !receivedMsg.message) return;

        const receivedText = receivedMsg.message.conversation ||
          receivedMsg.message.extendedTextMessage?.text ||
          receivedMsg.message.buttonsResponseMessage?.selectedButtonId;
        const senderID = receivedMsg.key.remoteJid;
        const isReplyToBot = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;

        if (isReplyToBot && senderID === from) {
          clearTimeout(handlerTimeout);
          sock.ev.off('messages.upsert', messageHandler);
          handlerActive = false;

          const selectedNumber = receivedText.trim();
          const selectedModel = voiceModels.find(model => model.number === selectedNumber);

          if (!selectedModel) {
            return extra.reply('❌ Invalid option! Please reply with a number from the menu.');
          }

          try {
            // Show processing message
            await sock.sendMessage(from, {
              text: `🔊 Generating audio with ${selectedModel.name} voice...`
            }, { quoted: receivedMsg });

            // Call the API
            const apiUrl = `https://api.agatz.xyz/api/voiceover?text=${encodeURIComponent(inputText)}&model=${selectedModel.model}`;
            const response = await axios.get(apiUrl, {
              timeout: 30000 // 30 seconds timeout
            });

            const data = response.data;

            if (data.status === 200) {
              await sock.sendMessage(from, {
                audio: { url: data.data.oss_url },
                mimetype: 'audio/mpeg'
                // ptt: true nahi lagaya, taake normal audio ki tarah bheje jaye
              }, { quoted: receivedMsg });
            } else {
              extra.reply('❌ Error generating audio. Please try again.');
            }
          } catch (error) {
            console.error('API Error:', error.message);
            extra.reply('❌ Error processing your request. Please try again.');
          }
        }
      };

      // Register the handler
      sock.ev.on('messages.upsert', messageHandler);

    } catch (error) {
      console.error('Command Error:', error.message);
      return extra.reply('❌ An error occurred. Please try again.');
    }
  }
};
