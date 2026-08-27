const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { updateGuildData } = require('../../events/activityUtils');

// 2024 היא שנה מעוברת, כך ש-29/02 נחשב תאריך תקין
const LEAP_PROBE_YEAR = 2024;
function isRealDate(day, month) {
    const probe = new Date(LEAP_PROBE_YEAR, month - 1, day);
    return probe.getMonth() === month - 1 && probe.getDate() === day;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('birthday')
        .setDescription('הגדר את יום ההולדת שלך')
        .addIntegerOption(option => option.setName('day').setDescription('יום (1-31)').setRequired(true).setMinValue(1).setMaxValue(31))
        .addIntegerOption(option => option.setName('month').setDescription('חודש (1-12)').setRequired(true).setMinValue(1).setMaxValue(12)),

    async execute(interaction) {
        // הפקודות נרשמות גלובלית, ולכן אפשר להריץ אותן גם ב-DM שבו אין guild
        if (!interaction.guild) {
            await interaction.reply({
                content: 'אפשר לקבוע יום הולדת רק בתוך שרת, לא בהודעה פרטית.',
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const day = interaction.options.getInteger('day');
        const month = interaction.options.getInteger('month');

        // 31/02 וחבריו עוברים את מגבלות דיסקורד (1-31 ו-1-12) אבל לא קיימים
        // בלוח השנה, ולכן לא יתאימו לאף תאריך ולעולם לא תישלח עליהם ברכה
        if (!isRealDate(day, month)) {
            await interaction.reply({
                content: `התאריך ${day}/${month} לא קיים בלוח השנה. בדוק את היום והחודש ונסה שוב.`,
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const userId = interaction.user.id;
        const birthdayString = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}`;

        // updateGuildData מבצע קריאה-שינוי-כתיבה תחת מנעול השרת. בלי המנעול,
        // אירוע presence/voice מקביל דורס את הרשומה בעודנו מדווחים "עודכן".
        try {
            await updateGuildData(interaction.guild.id, (guildData) => {
                if (!Array.isArray(guildData.aBirthDayList)) guildData.aBirthDayList = [];

                const userIndex = guildData.aBirthDayList.findIndex(u => u.id === userId);
                const existing = userIndex > -1 ? guildData.aBirthDayList[userIndex] : null;

                const userData = {
                    id: userId,
                    username: interaction.user.username,
                    birthday: birthdayString, // נשמר כ-DD/MM
                    // שומרים על הדגל כשהתאריך לא השתנה, כדי שעדכון חוזר באותו
                    // יום לא יגרום לברכה שנייה
                    announcedThisYear:
                        existing && existing.birthday === birthdayString
                            ? existing.announcedThisYear === true
                            : false,
                };

                if (userIndex > -1) {
                    guildData.aBirthDayList[userIndex] = userData;
                } else {
                    guildData.aBirthDayList.push(userData);
                }
            });
        } catch (err) {
            // לא מאשרים שמירה שלא קרתה
            console.error(`[birthdays] שמירת יום הולדת ל-${userId} בשרת ${interaction.guild.id} נכשלה:`, err);
            await interaction.reply({
                content: 'שמירת יום ההולדת נכשלה. נסה שוב בעוד רגע.',
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        await interaction.reply({ content: `יום ההולדת שלך עודכן ל-${birthdayString}!`, flags: MessageFlags.Ephemeral });
    },
};
