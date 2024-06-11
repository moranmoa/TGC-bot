const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kicks a Member")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false)
    .addUserOption((option) =>
      option.setName("user").setDescription("user to kick").setRequired(true)
    ),
  async execute(interaction) {
    await interaction.reply("Pong!");
  },
};
