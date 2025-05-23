const { fetchDoujin } = require('../utils/fetchDoujin');
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (interaction.isChatInputCommand()) {
      const cmd = client.commands.get(interaction.commandName);
      if (!cmd) return;
      try {
        await cmd.execute(interaction);
      } catch (e) {
        console.error('Command error:', e);
        return interaction.reply({ content: 'Ошибка в команде.', ephemeral: true });
      }
    }

    if (!interaction.isButton()) return;
    await interaction.deferUpdate();

    const [action, ownerId, id, pageStr] = interaction.customId.split('_');
    const page = parseInt(pageStr);

    if (interaction.user.id !== ownerId) {
      return interaction.followUp({
        content: '❌ Только инициатор команды может нажимать эти кнопки.',
        ephemeral: true
      });
    }

    let newPage = action === 'next' ? page + 1 : page - 1;
    const result = await fetchDoujin(id, newPage);
    if (!result) {
      return interaction.followUp({ content: 'Не удалось загрузить страницу.', ephemeral: true });
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`prev_${ownerId}_${id}_${newPage}`)
        .setLabel('⬅️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(newPage === 1),
      new ButtonBuilder()
        .setCustomId(`next_${ownerId}_${id}_${newPage}`)
        .setLabel('➡️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(newPage === result.totalPages)
    );

    return interaction.editReply({
      embeds: [result.embed],
      files: result.attachment ? [result.attachment] : [],
      components: [row]
    });
  }
};
