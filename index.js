require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, REST, Routes, ActivityType } = require('discord.js');

// Проверка необходимых переменных окружения
const requiredEnvVars = ['DISCORD_TOKEN', 'CLIENT_ID', 'GUILD_ID'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Отсутствуют обязательные переменные окружения:', missingEnvVars.join(', '));
  process.exit(1);
}

// Создание клиента
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  presence: {
    activities: [{
      name: '/hentai',
      type: ActivityType.Playing
    }],
    status: 'online'
  }
});

client.commands = new Collection();

// Загрузка команд
const commands = [];
const commandsPath = path.join(__dirname, 'commands');

if (!fs.existsSync(commandsPath)) {
  console.error('❌ Папка commands не найдена!');
  process.exit(1);
}

const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

console.log(`📂 Загрузка ${commandFiles.length} команд...`);

for (const file of commandFiles) {
  try {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if (!command.data || !command.execute) {
      console.warn(`⚠️  Команда ${file} не содержит data или execute`);
      continue;
    }
    
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
    console.log(`  ✓ ${command.data.name}`);
  } catch (error) {
    console.error(`❌ Ошибка загрузки команды ${file}:`, error.message);
  }
}

// Регистрация команд в Discord
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('🔄 Регистрация слэш-команд...');
    
    // Регистрация команд для конкретной гильдии (быстрее для разработки)
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );
    
    console.log('✅ Слэш-команды зарегистрированы!');
    
    // Для продакшена можно использовать глобальные команды:
    // await rest.put(
    //   Routes.applicationCommands(process.env.CLIENT_ID),
    //   { body: commands }
    // );
  } catch (error) {
    console.error('❌ Ошибка при регистрации команд:', error);
  }
})();

// Загрузка событий
const eventsPath = path.join(__dirname, 'events');

if (!fs.existsSync(eventsPath)) {
  console.warn('⚠️  Папка events не найдена, создаю...');
  fs.mkdirSync(eventsPath);
}

const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

console.log(`📂 Загрузка ${eventFiles.length} событий...`);

for (const file of eventFiles) {
  try {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    
    if (!event.name || !event.execute) {
      console.warn(`⚠️  Событие ${file} не содержит name или execute`);
      continue;
    }
    
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
    
    console.log(`  ✓ ${event.name}`);
  } catch (error) {
    console.error(`❌ Ошибка загрузки события ${file}:`, error.message);
  }
}

// Обработка необработанных ошибок
process.on('unhandledRejection', (error) => {
  console.error('❌ Необработанная ошибка Promise:', error);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Необработанное исключение:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Получен сигнал SIGINT, завершаю работу...');
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Получен сигнал SIGTERM, завершаю работу...');
  client.destroy();
  process.exit(0);
});

// Логин
console.log('🚀 Запуск бота...');
client.login(process.env.DISCORD_TOKEN).catch(error => {
  console.error('❌ Ошибка при подключении к Discord:', error);
  process.exit(1);
});