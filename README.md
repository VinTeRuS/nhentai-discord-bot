# nhentai Discord Bot

Discord bot for working with nhentai.net API

---

## Features

- `/hentai random` - random gallery
- `/hentai id <code> [page]` - view gallery by ID with page selection
- `/hentai search <tag> [sort]` - search by tag with sorting
- `/hentai info <code>` - detailed gallery information
- `/hentai trending [page]` - trending galleries
- `/hentai popular [period]` - most popular galleries by period
- `/hentai tags <include> [exclude]` - advanced tag search

Button navigation, request caching, multiple CDNs for stability

---

## Installation

```bash
git clone https://github.com/VinTeRuS/nhentai-discord-bot.git
cd nhentai-discord-bot
npm install
```

---

## Configuration

Create `.env` file:

```env
DISCORD_TOKEN=your_discord_token
CLIENT_ID=your_bot_id
GUILD_ID=your_server_id
```

---

## Running

```bash
node index.js
```

---

## Commands

| Command | Description |
|---------|-------------|
| `/hentai random` | Random gallery |
| `/hentai id <code> [page]` | Gallery by ID |
| `/hentai search <tag> [sort]` | Search by tag |
| `/hentai info <code>` | Gallery information |
| `/hentai trending [page]` | Trending now |
| `/hentai popular [period]` | Popular by period |
| `/hentai tags <include> [exclude]` | Advanced tag search |

---

## Dependencies

- discord.js
- dotenv
- axios

---

## License

MIT