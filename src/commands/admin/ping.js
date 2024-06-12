const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  Component,
} = require("discord.js");
const log4js = require("log4js");
const {} = require("../../logger");
const appLogger = log4js.getLogger("client");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Checks for a server Roundtrip & Heartbeat")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),
  async execute(interaction) {
    try {
      const sent = await interaction.deferReply({
        fetchReply: true,
        ephemeral: true,
      });

      appLogger.info("received a ping command", {
        guildId: interaction.guild.id,
        guildName: interaction.guild.name,
        userId: interaction.member.user.id,
        userName: interaction.member.user.globalName,
      });

      let roundtripCalculation =
        sent.createdTimestamp - interaction.createdTimestamp;
      const evalMessage = "```" + roundtripCalculation + "ms```";

      const responseEmbed = new EmbedBuilder()
        .setTitle("🏓 PONG! 🏓")
        .setColor("#7289DA")
        .setTimestamp(Date.now())
        .addFields([
          {
            name: `🔁 Roundtrip Latency 🔁`,
            value: `${evalMessage}`,
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
    } catch (error) {
      await appLogger.error("failed to send a ping command", {
        guildId: interaction.guild.id,
        guildName: interaction.guild.name,
        userId: interaction.member.user.id,
        userName: interaction.member.user.globalName,
        Error: error,
      });
      // log4js.shutdown(() => process.exit(1)); // is a callback needed?
    }
  },
};

// TODO: Add Heartbeat calculation as soon as we deploy it to a server.
