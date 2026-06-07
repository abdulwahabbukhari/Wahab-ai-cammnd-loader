const axios = require("axios");
const googleTTS = require("google-tts-api");

module.exports = {
name: "tts",
aliases: ["say"],
category: "general",
description: "Convert text to speech",

async execute(sock, msg, args, extra) {
    try {
        const text = args.join(" ");

        if (!text) {
            return await extra.reply(
                "❌ Example: .tts Assalamualaikum"
            );
        }

        const url = googleTTS.getAudioUrl(text, {
            lang: "ur",
            slow: false,
            host: "https://translate.google.com",
        });

        const response = await axios.get(url, {
            responseType: "arraybuffer",
        });

        await sock.sendMessage(
            extra.from,
            {
                audio: Buffer.from(response.data),
                mimetype: "audio/mpeg"
            },
            { quoted: msg }
        );

    } catch (err) {
        console.error("TTS Error:", err);

        await extra.reply(
            "❌ TTS Error: " + err.message
        );
    }
}

};