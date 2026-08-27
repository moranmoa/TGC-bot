const { getGuildData, updateGuildData } = require("../events/activityUtils");

// בדיקה כל 10 דקות ולא כל שעה: הטיימר נוטה לדריפט של דקות ארוכות כשהקונטיינר
// נחנק, ובקצב של פעם בשעה דריפט כזה יכול לדלג על חלון הברכות לגמרי.
const CHECK_INTERVAL_MS = 10 * 60 * 1000;
const WINDOW_START_HOUR = 12;
const WINDOW_END_HOUR = 15;

const pad2 = (n) => n.toString().padStart(2, "0");
const isLeapYear = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

// אחרי ניתוק מהגייטוויי הקאש עלול להיות ריק; מושכים מה-API במקום לוותר בשקט.
async function resolveBirthdayChannel(guild, channelId) {
    if (!channelId) {
        console.error(`[birthdays] לא הוגדר ערוץ ברכות בשרת ${guild.id}`);
        return null;
    }
    const cached = guild.channels.cache.get(channelId);
    if (cached) return cached;
    try {
        return await guild.channels.fetch(channelId);
    } catch (err) {
        console.error(
            `[birthdays] ערוץ הברכות ${channelId} לא נמצא בשרת ${guild.id}:`,
            err.message
        );
        return null;
    }
}

async function checkBirthdays(guild) {
    let guildData = await getGuildData(guild.id);

    // בדיקה אם המערכת פעילה
    if (!guildData.birthdayToast || !guildData.birthdayToast.enabled) return;

    const now = new Date();
    const currentYear = now.getFullYear();

    // איפוס שנתי לפי השנה השמורה, ולא לפי "האם היום 01/01": אם הבוט לא רץ
    // ב-1 בינואר, האיפוס פשוט יקרה בהרצה הראשונה שלו בשנה החדשה.
    if (guildData.birthdayToast.lastResetYear !== currentYear) {
        guildData = await updateGuildData(guild.id, (data) => {
            if (!data.birthdayToast) return;
            const hadResetYear = data.birthdayToast.lastResetYear !== undefined;
            // דאטה ותיק שאין בו lastResetYear: רק מאמצים את השנה הנוכחית בלי לאפס,
            // אחרת מי שכבר קיבל ברכה השנה יקבל אותה שוב.
            if (hadResetYear && Array.isArray(data.aBirthDayList)) {
                data.aBirthDayList.forEach((u) => { u.announcedThisYear = false; });
                console.log(`[birthdays] איפוס שנתי לשנת ${currentYear} בשרת ${guild.id}`);
            }
            data.birthdayToast.lastResetYear = currentYear;
        });
        if (!guildData || !guildData.birthdayToast) return;
    }

    // בדיקת שעה (חלון של 12:00-15:00 שעון מקומי)
    const currentHour = now.getHours();
    if (currentHour < WINDOW_START_HOUR || currentHour > WINDOW_END_HOUR) return;

    const todayStr = `${pad2(now.getDate())}/${pad2(now.getMonth() + 1)}`;
    // מי שנולד ב-29/02 מקבל את הברכה ב-28/02 בשנים שאינן מעוברות, כדי שלא
    // יישאר בלי ברכה שלוש שנים מתוך ארבע
    const leapBirthdayToday =
        todayStr === "28/02" && !isLeapYear(currentYear) ? "29/02" : null;
    const isBirthdayToday = (birthday) =>
        birthday === todayStr || (leapBirthdayToday !== null && birthday === leapBirthdayToday);

    const bdayList = Array.isArray(guildData.aBirthDayList) ? guildData.aBirthDayList : [];
    const due = bdayList.filter((u) => isBirthdayToday(u.birthday) && !u.announcedThisYear);
    if (due.length === 0) return;

    const birthdayChannel = await resolveBirthdayChannel(guild, guildData.birthdayToast.channel);
    if (!birthdayChannel) return;

    // השליחה מתבצעת מחוץ למנעול השרת: בקשה לדיסקורד יכולה להיתקע דקות ארוכות
    // בתור ה-rate limit, ואסור להחזיק בגללה מנעול שחוסם אירועי presence/voice.
    const announced = new Set();
    for (const userEntry of due) {
        try {
            await birthdayChannel.send(`🥳 מזל טוב ל- <@${userEntry.id}>! יום הולדת שמח! 🎉`);
            announced.add(userEntry.id);
        } catch (err) {
            // לא מסמנים announcedThisYear - הבדיקה הבאה תנסה שוב בעוד 10 דקות,
            // כל עוד אנחנו בתוך החלון.
            console.error(
                `[birthdays] שליחת ברכה ל-${userEntry.id} בשרת ${guild.id} נכשלה, ינוסה שוב:`,
                err.message
            );
        }
    }

    if (announced.size === 0) return;

    // מסמנים רק את מי שהברכה שלו באמת נשלחה בהצלחה
    await updateGuildData(guild.id, (data) => {
        if (!Array.isArray(data.aBirthDayList)) return;
        data.aBirthDayList.forEach((u) => {
            if (announced.has(u.id)) u.announcedThisYear = true;
        });
    });
    console.log(`[birthdays] נשלחו ${announced.size} ברכות בשרת ${guild.id}`);
}

// פונקציית הפעלה דומה ל-Goblin
function activateBirthdaySystem(guild) {
    const client = guild.client;
    const guildId = guild.id;
    let running = false;

    const tick = async () => {
        // בדיקה אחת יכולה להימשך יותר מ-10 דקות (תור rate limit / רשת איטית);
        // בלי המנעול הזה תקתוקים יצטברו וישלחו ברכות כפולות במקביל.
        if (running) return;
        running = true;
        try {
            // שליפה טרייה של ה-guild: האובייקט מרגע ההפעלה עלול להתיישן אחרי
            // ניתוק וחיבור מחדש לגייטוויי, ואז הקאש שלו ריק לנצח.
            const currentGuild = client.guilds.cache.get(guildId) || guild;
            await checkBirthdays(currentGuild);
        } catch (err) {
            // חייב להישאר כאן: בלי זה כל כישלון הופך ל-unhandledRejection שנעלם
            console.error(`[birthdays] בדיקת ימי הולדת נכשלה בשרת ${guildId}:`, err);
        } finally {
            running = false;
        }
    };

    setInterval(tick, CHECK_INTERVAL_MS);

    // הרצה ראשונית מיד בטעינה
    console.log(`[birthdays] מערכת ימי הולדת הופעלה בשרת ${guildId}`);
    tick();
}

module.exports = { activateBirthdaySystem };
