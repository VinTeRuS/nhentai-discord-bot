# 📚 nhentai Discord Bot

> Простенький NSFW Discord-бот, который отправляет случайный doujin с [nhentai.net](https://nhentai.net).  
> ⚠️ Работает только в NSFW-каналах.

---

## ✨ Возможности

- 🎲 Команда `/nhentai random` для случайного выбора
- 🖼 Удобная навигация с кнопками
- ⚡ Быстрая загрузка и простота в использовании

---

## 📦 Установка

```bash
git clone https://github.com/VinTeRuS/nhentai-discord-bot.git
cd nhentai-discord-bot
npm install
```

---

## ⚙️ Настройка

Создайте файл `.env` и укажите в нём:

```env
TOKEN=ваш_дискорд_токен
CLIENT_ID=айди_бота
GUILD_ID=айди_сервера (опционально)
```

---

## 🚀 Запуск

```bash
node index.js
```

---

## 📚 Команды

| Команда            | Описание                        |
|--------------------|----------------------------------|
| `/nhentai random`  | Отправляет случайный doujin     |

> ⛔ Только NSFW-каналы!

---

## 🔧 Зависимости

- [discord.js](https://discord.js.org)
- [dotenv](https://www.npmjs.com/package/dotenv)
- [node-fetch](https://www.npmjs.com/package/node-fetch)

---

## 📄 Лицензия

Проект распространяется под лицензией [MIT](./LICENSE).
