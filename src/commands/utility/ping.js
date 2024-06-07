const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
var data = []
var count =0;
module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong!")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    data.push(count)
    count++
    await interaction.reply("Pong! "+ data);
  },
};
