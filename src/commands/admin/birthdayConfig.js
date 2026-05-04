const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getGuildData, setGuildData } = require('../../events/activityUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('birthday-config')
        .setDescription('הגדרות מערכת ימי הולדת')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addBooleanOption(option => 
            option.setName('enable').setDescription('האם להפעיל את המערכת').setRequired(true))
        .addChannelOption(option => 
            option.setName('channel').setDescription('הערוץ בו יפורסמו הברכות').setRequired(true)),

    async execute(interaction) {
        const enable = interaction.options.getBoolean('enable');
        const channel = interaction.options.getChannel('channel');
        let guildData = await getGuildData(interaction.guild.id);

        guildData.birthdayToast = {
            enabled: enable,
            channel: channel.id,
            lastCheckedDate: new Date().toLocaleDateString('en-GB') // פורמט DD/MM/YYYY
        };

        // אתחול רשימת ימי ההולדת אם לא קיימת
        if (!guildData.aBirthDayList) {
            guildData.aBirthDayList = [];
        }

        await setGuildData(interaction.guild.id, guildData);
        await interaction.reply(`מערכת ימי ההולדת עודכנה: **${enable ? 'פעילה' : 'כבויה'}** בערוץ <#${channel.id}>`);
    },
};