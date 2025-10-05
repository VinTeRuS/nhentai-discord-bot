const { Events, ActivityType } = require('discord.js');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`✅ Бот запущен как ${client.user.tag}`);
    console.log(`📊 Серверов: ${client.guilds.cache.size}`);
    console.log(`👥 Пользователей: ${client.users.cache.size}`);
    console.log(`⚙️  Команд загружено: ${client.commands.size}`);
    
    // Устанавливаем статус бота
    const activities = [
      { name: '/hentai random', type: ActivityType.Playing },
      { name: '/hentai search', type: ActivityType.Playing },
      { name: `${client.guilds.cache.size} серверов`, type: ActivityType.Watching },
      { name: 'nhentai.net', type: ActivityType.Watching }
    ];

    let currentActivity = 0;

    // Меняем статус каждые 30 секунд
    setInterval(() => {
      client.user.setActivity(activities[currentActivity]);
      currentActivity = (currentActivity + 1) % activities.length;
    }, 30000);

    // Устанавливаем первый статус
    client.user.setActivity(activities[0]);
  }
};