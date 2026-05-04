const { SlashCommandBuilder } = require('discord.js');
const { getGuildData, setGuildData } = require('../../events/activityUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('birthday')
        .setDescription('הגדר את יום ההולדת שלך')
        .addIntegerOption(option => option.setName('day').setDescription('יום (1-31)').setRequired(true).setMinValue(1).setMaxValue(31))
        .addIntegerOption(option => option.setName('month').setDescription('חודש (1-12)').setRequired(true).setMinValue(1).setMaxValue(12)),

    async execute(interaction) {
        const day = interaction.options.getInteger('day');
        const month = interaction.options.getInteger('month');
        const userId = interaction.user.id;
        
        let guildData = await getGuildData(interaction.guild.id);
        if (!guildData.aBirthDayList) guildData.aBirthDayList = [];

        // חיפוש אם המשתמש כבר קיים
        const userIndex = guildData.aBirthDayList.findIndex(u => u.id === userId);
        const birthdayString = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}`;

        const userData = {
            id: userId,
            birthday: birthdayString, // נשמר כ-DD/MM
            announcedThisYear: false
        };

        if (userIndex > -1) {
            guildData.aBirthDayList[userIndex] = userData;
        } else {
            guildData.aBirthDayList.push(userData);
        }

        await setGuildData(interaction.guild.id, guildData);
        await interaction.reply({ content: `יום ההולדת שלך עודכן ל-${birthdayString}!`, ephemeral: true });
    },
};