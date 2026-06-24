const { SlashCommandBuilder } = require('discord.js')
const {getGuildData ,setGuildData} = require('../../events/activityUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spamprotection')
        .setDescription('enable or disable spam protection')
        .addBooleanOption(option =>
            option
                .setName('enable')
                .setDescription('enable or disable Spam protection')
        )
        .addChannelOption(option =>
            option
                .setName('logchannel')
                .setDescription('The channel to log spam protection actions')
        ),

    async execute(interaction) {
        const enable = interaction.options.getBoolean('enable');
        const logChannel = interaction.options.getChannel('logchannel');
        let guild = interaction.guild;
        var guildData = await getGuildData(guild.id);

        if (enable === null) {
            return interaction.reply({ content: 'Please provide the `enable` option.', ephemeral: true });
        }

        guildData.SpamProtection = enable;

        if (enable) {
            if (logChannel) {
                guildData.SpamProtectionLogChannel = logChannel.id;
            }
        } else {
            delete guildData.SpamProtectionLogChannel;
        }

        await setGuildData(guild.id, guildData);

        let response = `Spam protection ${enable ? 'enabled' : 'disabled'}`;
        if (enable && logChannel) {
            response += ` with log channel <#${logChannel.id}>`;
        }
        await interaction.reply(response);
    },
};