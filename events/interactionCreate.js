const { Events } = require('discord.js');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (!command) {
        return;
      }

      try {
        console.log(`${interaction.user.tag} использует /${interaction.commandName}`);
        await command.execute(interaction);
      } catch (error) {
        console.error(`Ошибка при выполнении команды ${interaction.commandName}:`, error);
        
        const errorMessage = {
          content: 'Произошла ошибка при выполнении команды',
          ephemeral: true
        };

        try {
          if (interaction.deferred || interaction.replied) {
            await interaction.editReply(errorMessage);
          } else {
            await interaction.reply(errorMessage);
          }
        } catch (replyError) {
          console.error('Не удалось отправить сообщение об ошибке:', replyError);
        }
      }
    }

    if (interaction.isButton()) {
      try {
        const [action, ownerId, id, currentPage] = interaction.customId.split('_');
        
        if (interaction.user.id !== ownerId) {
          return interaction.reply({
            content: 'Эта кнопка не для тебя',
            ephemeral: true
          });
        }

        const { fetchDoujin } = require('../utils/fetchDoujin');
        const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

        await interaction.deferUpdate();

        let page = parseInt(currentPage);
        const doujinId = parseInt(id);

        switch (action) {
          case 'prev':
            page = Math.max(1, page - 1);
            break;
          case 'next':
            page = page + 1;
            break;
          case 'info':
            const infoResult = await fetchDoujin(doujinId, 1, true);
            
            if (!infoResult) {
              return interaction.editReply({
                content: 'Не удалось загрузить информацию',
                components: []
              });
            }

            return interaction.editReply({
              embeds: [infoResult.infoEmbed],
              files: [],
              components: [
                new ActionRowBuilder().addComponents(
                  new ButtonBuilder()
                    .setCustomId(`prev_${ownerId}_${doujinId}_1`)
                    .setLabel('К галерее')
                    .setStyle(ButtonStyle.Primary)
                )
              ]
            });
          default:
            return;
        }

        const result = await fetchDoujin(doujinId, page);

        if (!result) {
          return interaction.editReply({
            content: 'Не удалось загрузить страницу',
            components: []
          });
        }

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`prev_${ownerId}_${doujinId}_${page}`)
            .setLabel('Назад')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === 1),
          new ButtonBuilder()
            .setCustomId(`info_${ownerId}_${doujinId}`)
            .setLabel('Инфо')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`next_${ownerId}_${doujinId}_${page}`)
            .setLabel('Вперёд')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === result.totalPages),
          new ButtonBuilder()
            .setLabel('Открыть')
            .setStyle(ButtonStyle.Link)
            .setURL(`https://nhentai.net/g/${doujinId}`)
        );

        await interaction.editReply({
          embeds: [result.embed],
          files: [result.attachment],
          components: [row]
        });

      } catch (error) {
        console.error('Ошибка обработки кнопки:', error);
        try {
          await interaction.editReply({
            content: 'Произошла ошибка при обработке кнопки',
            components: []
          });
        } catch (e) {
          console.error('Не удалось отправить сообщение об ошибке:', e);
        }
      }
    }
  }
};