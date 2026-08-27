const { getGuildData, setGuildData, withGuildLock } = require("../events/activityUtils");

// מנעול per-guild: הפונקציה כותבת את guildData כולו, ובלי המנעול היא דורסת
// עדכונים מקבילים (voice/presence/ימי הולדת) שנכתבו בזמן שהיא עבדה
async function resetEmptyChannels(guild) {
  return withGuildLock(guild.id, () => resetEmptyChannelsUnlocked(guild));
}

// 10003 = Unknown Channel. הערוץ כבר לא קיים בדיסקורד, כלומר המצב הרצוי הושג -
// אין סיבה להדפיס stack trace שלם על כל רשומה מיושנת בעלייה של הבוט.
const UNKNOWN_CHANNEL = 10003;
function deleteChannel(guild, channelId) {
  return guild.channels
    .delete(channelId, "making room for new channels")
    .catch((err) => {
      if (err.code === UNKNOWN_CHANNEL) {
        console.log(`[cleanup] ערוץ ${channelId} כבר לא קיים, הוסר מהרשימה`);
        return;
      }
      console.error(`[cleanup] מחיקת ערוץ ${channelId} נכשלה:`, err.message);
    });
}

async function resetEmptyChannelsUnlocked(guild) {
  var guildData = await getGuildData(guild.id);
  //filter out deleted rootChannels
  guildData.rootChannelId = guildData.rootChannelId.filter((rootChannelId) => {
    if (guild.channels.cache.get(rootChannelId)) {
      return true;
    } else {
      return false;
    }
  });

  // Filter out and delete empty channels
  guildData.aActiveChannels = guildData.aActiveChannels.filter(
    (activeChannel) => {
      try {
        const channel = guild.channels.cache.get(activeChannel.id);
        if (channel.members.size == 0) {
          deleteChannel(guild, activeChannel.id);
          return false; // Remove from the array
        }
      } catch (e) {
        try {
          deleteChannel(guild, activeChannel.id);
        }catch(e){
          console.log("cant delete channel \n", e)
        }
        return false; // Remove from the array
      }
      return true; // Keep in the array
    }
  );

  // Save the updated guildData if needed
  await setGuildData(guild.id, guildData);
}

module.exports = { resetEmptyChannels };
