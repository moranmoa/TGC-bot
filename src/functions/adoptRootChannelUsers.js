const { ChannelType } = require("discord.js");
const {
  getActivityName,
  getGuildData,
  setGuildData,
  withGuildLock,
} = require("../events/activityUtils");

// העברה נכשלת (בעיקר בגלל תקלת רשת רגעית) משאירה את המשתמש תקוע בחדר היצירה,
// כי חדר נוצר רק באירוע כניסה. מנסים שוב כמה פעמים בהפרשים קצרים.
const RETRY_DELAY_MS = 5000;
const MAX_RETRIES = 3;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// בעליית האפליקציה: אם נשארו משתמשים בתוך חדר היצירה (rootChannel) - למשל כי
// הבוט קרס או הופעל מחדש בזמן שהם היו שם - אף אחד לא ייצור להם חדר, כי החדר
// נוצר רק באירוע כניסה. כאן יוצרים להם חדר ומעבירים את כולם אליו, כך שהמצב
// זהה לחלוטין למצב שבו הראשון יצר חדר והשאר הצטרפו אליו.
async function adoptRootChannelUsers(guild) {
  const guildData = await getGuildData(guild.id);
  const rootChannelIds = Array.isArray(guildData.rootChannelId)
    ? guildData.rootChannelId
    : [];

  for (const rootChannelId of rootChannelIds) {
    const rootChannel = guild.channels.cache.get(rootChannelId);
    if (!rootChannel) continue;

    // בוטים לא נחשבים: אין טעם למנות בוט ל-master של חדר
    const members = [...rootChannel.members.values()].filter((m) => !m.user.bot);
    if (members.length === 0) continue;

    console.log(
      `[startup] נמצאו ${members.length} משתמשים בחדר היצירה "${rootChannel.name}" (${rootChannelId}) בשרת ${guild.id}: ` +
        members.map((m) => m.user.tag).join(", ")
    );

    try {
      await createRoomForMembers(guild, rootChannel, members);
    } catch (err) {
      console.error(
        `[startup] יצירת חדר עבור ${rootChannelId} בשרת ${guild.id} נכשלה:`,
        err
      );
    }
  }
}

async function createRoomForMembers(guild, rootChannel, members) {
  let newChannel = null;
  let master = null;
  let masterName = null;

  // המנעול מסודר מול voiceStateUpdate: אירועי המעבר שנוצרים כאן ימתינו לו,
  // ולכן החדר כבר יהיה רשום ב-aActiveChannels כשהם יטופלו - וכל משתמש יתווסף
  // ל-users דרך אותה לוגיקת הצטרפות רגילה, בלי כפילות קוד.
  await withGuildLock(guild.id, async () => {
    const firstName = getActivityName(members[0]);
    newChannel = await guild.channels.create({
      name: firstName.name,
      type: ChannelType.GuildVoice,
      parent: rootChannel.parent,
    });

    // הראשון שההעברה שלו מצליחה הוא ה-master, כדי לא לרשום master שכלל לא
    // נמצא בחדר (ואז ההעברה לבא בתור בעת יציאה לא תעבוד)
    for (const member of members) {
      try {
        await member.voice.setChannel(newChannel);
        master = member;
        break;
      } catch (err) {
        console.error(
          `[startup] העברת ${member.user.tag} לחדר החדש נכשלה:`,
          err.message
        );
      }
    }

    if (!master) {
      console.error(
        `[startup] אף משתמש לא הועבר, מוחקים את החדר שנוצר בשרת ${guild.id}`
      );
      await newChannel.delete("no users could be moved").catch(() => {});
      newChannel = null;
      return;
    }

    // שם החדר נקבע לפי ה-master בפועל; שונה מהשם הראשוני רק אם ההעברה של
    // המשתמש הראשון נכשלה ומישהו אחר נבחר
    masterName = getActivityName(master);
    if (masterName.name !== firstName.name) {
      await newChannel
        .edit({ name: masterName.name })
        .catch((err) =>
          console.error(`[startup] שינוי שם החדר נכשל:`, err.message)
        );
    }

    const data = await getGuildData(guild.id);
    if (!Array.isArray(data.aActiveChannels)) data.aActiveChannels = [];
    data.aActiveChannels.push({
      id: newChannel.id,
      users: [], // מתמלא ע"י voiceStateUpdate כשאירועי המעבר יטופלו
      master: master.id,
      name: masterName,
    });
    await setGuildData(guild.id, data);

    console.log(
      `[startup] נוצר חדר "${masterName.name}" (${newChannel.id}) בשרת ${guild.id}, מנהל: ${master.user.tag}`
    );
  });

  if (!newChannel || !master) return;

  // שאר המשתמשים מועברים מחוץ למנעול: כל העברה היא קריאת רשת, ואין סיבה
  // להחזיק בגללה מנעול שחוסם אירועי voice/presence אחרים בשרת
  const failed = [];
  let moved = 1;
  for (const member of members) {
    if (member.id === master.id) continue;
    try {
      await member.voice.setChannel(newChannel);
      moved++;
    } catch (err) {
      console.error(
        `[startup] העברת ${member.user.tag} לחדר ${newChannel.id} נכשלה:`,
        err.message
      );
      failed.push(member);
    }
  }

  console.log(
    `[startup] הועברו ${moved}/${members.length} משתמשים לחדר ${newChannel.id}`
  );

  if (failed.length) {
    // בכוונה בלי await: אין סיבה לעכב את עליית הבוט בגלל ניסיונות חוזרים
    retryStragglers(guild, rootChannel, newChannel, failed).catch((err) =>
      console.error(`[startup] ניסיונות חוזרים בשרת ${guild.id} נכשלו:`, err)
    );
  }
}

// מנסה שוב להעביר משתמשים שנשארו מאחור, אבל רק אם הם עוד תקועים בחדר היצירה -
// מי שיצא או עבר בעצמו בינתיים נשאר בשקט במקום שבו הוא בחר להיות.
async function retryStragglers(guild, rootChannel, targetChannel, stragglers) {
  let remaining = stragglers;

  for (let attempt = 1; attempt <= MAX_RETRIES && remaining.length; attempt++) {
    await sleep(RETRY_DELAY_MS);

    // אם החדר נמחק בינתיים (כל מי שכן הועבר יצא) אין לאן להעביר
    const room = guild.channels.cache.get(targetChannel.id);
    if (!room) {
      console.log(
        `[startup] חדר ${targetChannel.id} כבר לא קיים, מפסיקים ניסיונות עבור ${remaining.length} משתמשים`
      );
      return;
    }

    const stillStuck = [];
    for (const member of remaining) {
      // קוראים את המצב החי ולא את מה שהיה בזמן הכישלון
      const live = guild.members.cache.get(member.id) || member;
      const currentChannelId = live.voice ? live.voice.channelId : null;

      if (currentChannelId === null) {
        console.log(`[startup] ${member.user.tag} יצא מהשיחה, לא מנסים שוב`);
        continue;
      }
      if (currentChannelId === room.id) {
        console.log(`[startup] ${member.user.tag} כבר בחדר ${room.id}, לא מנסים שוב`);
        continue;
      }
      if (currentChannelId !== rootChannel.id) {
        console.log(
          `[startup] ${member.user.tag} עבר בעצמו לערוץ ${currentChannelId}, לא מנסים שוב`
        );
        continue;
      }

      try {
        await live.voice.setChannel(room);
        console.log(
          `[startup] ${member.user.tag} הועבר לחדר ${room.id} בניסיון ${attempt}`
        );
      } catch (err) {
        console.error(
          `[startup] ניסיון ${attempt}/${MAX_RETRIES} להעביר את ${member.user.tag} נכשל:`,
          err.message
        );
        stillStuck.push(member);
      }
    }
    remaining = stillStuck;
  }

  if (remaining.length) {
    console.error(
      `[startup] ${remaining.length} משתמשים נשארו בחדר היצירה ${rootChannel.id} אחרי ${MAX_RETRIES} ניסיונות: ` +
        remaining.map((m) => m.user.tag).join(", ")
    );
  }
}

module.exports = { adoptRootChannelUsers };
