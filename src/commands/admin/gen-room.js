const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
} = require("discord.js");
const { getGuildData, setGuildData } = require("../../events/activityUtils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gen-room")
    .setDescription("create a voice room generator channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName("room_name")
        .setDescription("set the rooms name")
        .setRequired(true)
    ),

  async execute(interaction) {
    let name = interaction.options.getString("room_name");
    let guild = interaction.guild;
    var guildData = await getGuildData(guild.id);
    const genNewChannel = await guild.channels.create({
      name: name,
      type: ChannelType.GuildVoice,
      parent: interaction.channel.parent,
    });
    guildData.rootChannelId.push(genNewChannel.id);
    setGuildData(guild.id, guildData);

    await interaction.reply(
      `voice room generator channel created https://discord.com/channels/${guild.id}/${genNewChannel.id}`
    );
  },
};
