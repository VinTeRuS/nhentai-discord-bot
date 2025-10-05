const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require('discord.js');
const { fetchDoujin, searchDoujin, getRandomId, getTrending, getPopular } = require('../utils/fetchDoujin');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hentai')
    .setDescription('Команды для работы с nhentai')
    .addSubcommand(subcommand =>
      subcommand
        .setName('random')
        .setDescription('Случайная галерея с nhentai')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('id')
        .setDescription('Получить галерею по ID')
        .addIntegerOption(option =>
          option
            .setName('code')
            .setDescription('ID галереи')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(999999)
        )
        .addIntegerOption(option =>
          option
            .setName('page')
            .setDescription('Номер страницы для просмотра')
            .setRequired(false)
            .setMinValue(1)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('search')
        .setDescription('Поиск галереи по тегу')
        .addStringOption(option =>
          option
            .setName('tag')
            .setDescription('Тег для поиска')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('sort')
            .setDescription('Сортировка результатов')
            .setRequired(false)
            .addChoices(
              { name: 'Популярные', value: 'popular' },
              { name: 'Недавние', value: 'recent' },
              { name: 'Случайные', value: 'random' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('info')
        .setDescription('Полная информация о галерее')
        .addIntegerOption(option =>
          option
            .setName('code')
            .setDescription('ID галереи')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(999999)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('trending')
        .setDescription('Популярные галереи сейчас')
        .addIntegerOption(option =>
          option
            .setName('page')
            .setDescription('Страница результатов')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(10)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('popular')
        .setDescription('Самые популярные галереи')
        .addStringOption(option =>
          option
            .setName('period')
            .setDescription('Период популярности')
            .setRequired(false)
            .addChoices(
              { name: 'Сегодня', value: 'today' },
              { name: 'Неделя', value: 'week' },
              { name: 'Месяц', value: 'month' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('tags')
        .setDescription('Поиск по нескольким тегам')
        .addStringOption(option =>
          option
            .setName('include')
            .setDescription('Теги которые должны быть (через запятую)')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('exclude')
            .setDescription('Теги которые исключить (через запятую)')
            .setRequired(false)
        )
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const subcommand = interaction.options.getSubcommand();
    const ownerId = interaction.user.id;
    let id, page = 1, result;

    try {
      switch (subcommand) {
        case 'random':
          id = await getRandomId();
          result = await fetchDoujin(id, page);
          break;

        case 'id':
          id = interaction.options.getInteger('code');
          page = interaction.options.getInteger('page') || 1;
          
          if (!id) {
            return interaction.editReply('Укажи корректный ID галереи.');
          }
          
          result = await fetchDoujin(id, page);
          break;

        case 'search':
          const tag = interaction.options.getString('tag');
          const sort = interaction.options.getString('sort') || 'random';
          
          if (!tag) {
            return interaction.editReply('Укажи тег для поиска.');
          }
          
          await interaction.editReply(`Поиск галерей с тегом "${tag}"...`);
          
          const searchResult = await searchDoujin(tag, sort);
          
          if (!searchResult) {
            return interaction.editReply(`Не удалось найти галерею с тегом "${tag}".`);
          }
          
          id = searchResult.id;
          result = await fetchDoujin(id, page);
          break;

        case 'info':
          id = interaction.options.getInteger('code');
          
          if (!id) {
            return interaction.editReply('Укажи корректный ID галереи.');
          }
          
          const infoResult = await fetchDoujin(id, 1, true);
          
          if (!infoResult) {
            return interaction.editReply(`Не удалось получить информацию о галерее ${id}.`);
          }
          
          return interaction.editReply({
            embeds: [infoResult.infoEmbed],
            components: []
          });

        case 'trending':
          const trendPage = interaction.options.getInteger('page') || 1;
          const trendResult = await getTrending(trendPage);
          
          if (!trendResult) {
            return interaction.editReply('Не удалось получить популярные галереи.');
          }
          
          id = trendResult.id;
          result = await fetchDoujin(id, page);
          break;

        case 'popular':
          const period = interaction.options.getString('period') || 'week';
          const popResult = await getPopular(period);
          
          if (!popResult) {
            return interaction.editReply('Не удалось получить популярные галереи.');
          }
          
          id = popResult.id;
          result = await fetchDoujin(id, page);
          break;

        case 'tags':
          const includeTags = interaction.options.getString('include');
          const excludeTags = interaction.options.getString('exclude') || '';
          
          await interaction.editReply('Поиск по указанным тегам...');
          
          const tagsResult = await searchDoujin(includeTags, 'random', excludeTags);
          
          if (!tagsResult) {
            return interaction.editReply('Не удалось найти галерею с указанными тегами.');
          }
          
          id = tagsResult.id;
          result = await fetchDoujin(id, page);
          break;

        default:
          return interaction.editReply('Неизвестная команда.');
      }

      if (!result) {
        return interaction.editReply('Не удалось получить галерею. Попробуй другой ID.');
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`prev_${ownerId}_${id}_${page}`)
          .setLabel('Назад')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === 1),
        new ButtonBuilder()
          .setCustomId(`info_${ownerId}_${id}`)
          .setLabel('Инфо')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`next_${ownerId}_${id}_${page}`)
          .setLabel('Вперёд')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === result.totalPages),
        new ButtonBuilder()
          .setLabel('Открыть')
          .setStyle(ButtonStyle.Link)
          .setURL(`https://nhentai.net/g/${id}`)
      );

      return interaction.editReply({
        embeds: [result.embed],
        files: [result.attachment],
        components: [row]
      });
    } catch (error) {
      console.error('Ошибка в execute:', error);
      return interaction.editReply('Произошла ошибка при выполнении команды.');
    }
  }
};