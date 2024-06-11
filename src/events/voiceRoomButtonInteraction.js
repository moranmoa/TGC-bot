const {
  Events,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require("discord.js");

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isButton() || !interaction.customId) return;

    const modal = new ModalBuilder()
      .setTitle(`Embed Builder`)
      .setCustomId("modal");

    const title = new TextInputBuilder()
      .setCustomId(`title`)
      .setLabel(`Title`)
      .setRequired(true)
      .setPlaceholder(`Room Name`)
      .setStyle(TextInputStyle.Short);

    const firstAction = new ActionRowBuilder().addComponents(title);

    modal.addComponents(firstAction);

    interaction.showModal(modal);

    try {
      interaction.client.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isModalSubmit()) return;

        if (interaction.customId == "modal") {
          const submittedTitle = interaction.fields.getTextInputValue(`title`);
          interaction.channel.edit({ name: submittedTitle });
          await interaction.reply(`Channel Name updated to ${submittedTitle}`);
        }
      });
    } catch (error) {
      console.log(error);
    }
  },
};
