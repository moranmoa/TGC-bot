const { Events } = require("discord.js");
const { getActivityName, whatName, getGuildData, setGuildData, withGuildLock } = require('./activityUtils');

module.exports = {
  name: Events.PresenceUpdate,
  async execute(oldPresence, newPresence) {
    if (!newPresence || !newPresence.guild) return;
    const guild = newPresence.guild;

    // ערוצים שצריך לעדכן להם את השם בדיסקורד (מבוצע אחרי שהנתונים נשמרו)
    const toRename = [];

    // מנעול per-guild: מסדר את הקריאה-שינוי-כתיבה מול אירועי voice/presence אחרים
    await withGuildLock(guild.id, async () => {
      const guildData = await getGuildData(guild.id);
      let changed = false;

      if (!guildData.aActiveChannels) {
        guildData.aActiveChannels = [];
        changed = true;
      }

      guildData.aActiveChannels.forEach((activeChannel) => {
        if (activeChannel.master == newPresence.userId) {
          const newName = getActivityName(newPresence.member);
          if (whatName(activeChannel.name, newName)) {
            activeChannel.name = newName; // נשמר עכשיו (קודם השינוי אבד)
            changed = true;
            toRename.push({ id: activeChannel.id, newName });
          }
        }
      });

      // כותבים רק אם משהו באמת השתנה - presenceUpdate נורה בתדירות גבוהה
      if (changed) {
        await setGuildData(guild.id, guildData);
      }
    });

    // מבצעים את שינוי השם בדיסקורד אחרי שהנתונים נשמרו
    for (const { id, newName } of toRename) {
      const voiceChannel = guild.channels.cache.get(id);
      if (!voiceChannel) continue;
      try {
        console.log("********** voice changing name to ", newName.name);
        voiceChannel.edit({ name: newName.name })
          .then((ch) => { if (ch) console.log("* voceChannel name is ", ch.name); })
          .catch(console.error);
      } catch (e) {
        console.log("*** voice changing Error \n", e);
      }
    }
  },
};
