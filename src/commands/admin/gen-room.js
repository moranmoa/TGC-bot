const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { getGuildData ,setGuildData} = require("../../events/activityUtils");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gen-room')
        .setDescription('set voice room generator chanel')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option
                .setName('room_name')
                .setDescription('set voice room generator chanel')
                .setRequired(true)
        ),
        
    async execute(interaction) {
        let name = interaction.options.getString('room_name');
        let guild = interaction.guild
        var guildData = await getGuildData(guild.id); 
        const genNewChannel = await guild.channels.create({
            name: name,
            type: ChannelType.GuildVoice,
            parent: interaction.channel.parent,
          });
          guildData.rootChannelId.push(genNewChannel.id)
          setGuildData(guild.id , guildData); 

        await interaction.reply(`voice room generator chanel created https://discord.com/channels/${guild.id}/${genNewChannel.id}`);
    },
};