const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  Component,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Checks for a server Roundtrip & Heartbeat")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),
  async execute(interaction, client) {
    const sent = await interaction.deferReply({
      fetchReply: true,
      ephemeral: true,
    });

    let tripCalc = sent.createdTimestamp - interaction.createdTimestamp;
    const eval = "```" + tripCalc + "ms```";
    const responseEmbed = new EmbedBuilder()
      .setTitle("🏓 PONG! 🏓")
      .setColor("#7289DA")
      .setTimestamp(Date.now())
      .addFields([
        {
          name: `🔁 Roundtrip Latency 🔁`,
          value: `${eval}`,
        },
      ]);

    const inviteButton = new ButtonBuilder()
      .setLabel("Invite the bot")
      .setStyle(ButtonStyle.Link)
      .setURL(
        "https://discord.com/oauth2/authorize?client_id=1248310840260690054&permissions=8&integration_type=0&scope=bot+applications.commands"
      );

    const buttonRow = new ActionRowBuilder().addComponents(inviteButton);
    interaction.editReply({
      embeds: [responseEmbed],
      components: [buttonRow],
    });
  },
};

// TODO: Add Heartbeat calculation as soon as we deploy it to a server.
