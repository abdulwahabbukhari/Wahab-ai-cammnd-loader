module.exports = {
  name: 'joke',
  category: 'fun',

  async execute(sock, msg, args, extra) {
    const jokes = [
      "Why don't scientists trust atoms? Because they make up everything!",
      "What do you call a fake noodle? An impasta!"
    ];

    const joke = jokes[Math.floor(Math.random() * jokes.length)];

    return extra.reply(`😂 Joke\n\n${joke}`);
  }
};
