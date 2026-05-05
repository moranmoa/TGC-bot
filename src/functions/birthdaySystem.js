const { getGuildData, setGuildData } = require("../events/activityUtils");

async function checkBirthdays(guild) {
    let guildData = await getGuildData(guild.id);
    
    // בדיקה אם המערכת פעילה
    if (!guildData.birthdayToast || !guildData.birthdayToast.enabled) return;

    const now = new Date();
    const todayStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    const todayFullDate = now.toLocaleDateString('en-GB');

    // בדיקת איפוס שנתי (ב-1 לינואר או כשמשתנה התאריך ליום חדש)
    if (guildData.birthdayToast.lastCheckedDate !== todayFullDate) {
        // אם עברנו יום והיום הוא 01/01 - מאפסים את כל הדגלים
        if (todayStr === "01/01") {
            guildData.aBirthDayList.forEach(u => u.announcedThisYear = false);
        }
        guildData.birthdayToast.lastCheckedDate = todayFullDate;
        await setGuildData(guild.id, guildData);
    }

    // בדיקת שעה (סביב 12 בצהריים)
    const currentHour = now.getHours();
    if (currentHour >= 12 && currentHour <= 15) {
        const birthdayChannel = guild.channels.cache.get(guildData.birthdayToast.channel);
        if (!birthdayChannel) return;

        let dataChanged = false;

        for (let userEntry of guildData.aBirthDayList) {
            if (userEntry.birthday === todayStr && !userEntry.announcedThisYear) {
                console.log("BBBBBB  הולדת מזל טוב Birthdays ")
                await birthdayChannel.send(`🥳 מזל טוב ל- <@${userEntry.id}>! יום הולדת שמח! 🎉`);
                userEntry.announcedThisYear = true;
                dataChanged = true;
            }
        }

        if (dataChanged) {
            await setGuildData(guild.id, guildData);
        }
    }
}

// פונקציית הפעלה דומה ל-Goblin
function activateBirthdaySystem(guild) {
// בדיקה כל 60 דקות 
setInterval(() => {
    checkBirthdays(guild);
    console.log("BBBBBB check Birthdays ")
}, 60 * 60 * 1000);
    
    // הרצה ראשונית מיד בטעינה
    console.log("BBBBBB first INIT check Birthdays ")
    checkBirthdays(guild);
}

module.exports = { activateBirthdaySystem };