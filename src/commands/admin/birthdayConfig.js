const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { updateGuildData } = require('../../events/activityUtils');

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
        // קריאה-שינוי-כתיבה תחת מנעול השרת, אחרת אירוע presence/voice מקביל
        // דורס את ההגדרות בעודנו מדווחים שהן עודכנו
        await updateGuildData(interaction.guild.id, (guildData) => {
            // פורסים את ההגדרות הקיימות כדי לא למחוק שדות פנימיים של המערכת
            // (כמו lastResetYear) - מחיקה שלהם גורמת לאיפוס שנתי מיותר
            guildData.birthdayToast = {
                ...(guildData.birthdayToast || {}),
                enabled: enable,
                channel: channel.id,
                lastCheckedDate: new Date().toLocaleDateString('en-GB') // פורמט DD/MM/YYYY
            };

            // אתחול רשימת ימי ההולדת אם לא קיימת
            if (!guildData.aBirthDayList) {
                guildData.aBirthDayList = [];
            }
        });

        await interaction.reply(`מערכת ימי ההולדת עודכנה: **${enable ? 'פעילה' : 'כבויה'}** בערוץ <#${channel.id}>`);
    },
};