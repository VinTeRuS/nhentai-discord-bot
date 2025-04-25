const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const { fetchDoujin } = require('../utils/fetchDoujin');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hentai')
    .setDescription('Случайная галерея с nhentai'),

  async execute(interaction) {
    await interaction.deferReply();

    const id = Math.floor(Math.random() * 500_000) + 1;
    const page = 1;

    const result = await fetchDoujin(id, page);
    if (!result) {
      return interaction.editReply('Не удалось получить случайную галерею. Попробуй ещё раз.');
    }

    const ownerId = interaction.user.id;
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`prev_${ownerId}_${id}_${page}`)
        .setLabel('⬅️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId(`next_${ownerId}_${id}_${page}`)
        .setLabel('➡️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page === result.totalPages)
    );

    return interaction.editReply({
      embeds:     [result.embed],
      files:      [result.attachment],
      components: [row]
    });
  }
};
