
# 📚 nhentai Discord Bot

> A simple NSFW Discord bot that sends a random doujin from [nhentai.net](https://nhentai.net).  
> ⚠️ Works only in NSFW channels.

---

## ✨ Features

- 🎲 `/nhentai random` command for random doujin selection  
- 🖼 Easy navigation with buttons  
- ⚡ Fast loading and user-friendly

---

## 📦 Installation

```bash
git clone https://github.com/VinTeRuS/nhentai-discord-bot.git
cd nhentai-discord-bot
npm install
```

---

## ⚙️ Configuration

Create a `.env` file and add the following:

```env
TOKEN=your_discord_token
CLIENT_ID=your_bot_id
GUILD_ID=your_server_id (optional)
```

---

## 🚀 Running

```bash
node index.js
```

---

## 📚 Commands

| Command            | Description                      |
|--------------------|----------------------------------|
| `/nhentai random`  | Sends a random doujin            |

> ⛔ NSFW channels only!

---

## 🔧 Dependencies

- [discord.js](https://discord.js.org)
- [dotenv](https://www.npmjs.com/package/dotenv)
- [node-fetch](https://www.npmjs.com/package/node-fetch)

---

## 📄 License

This project is licensed under the [MIT](./LICENSE) license.
