const { Events, ActivityType } = require("discord.js");
const { setGuildData } = require("./activityUtils");
const { resetEmptyChannels } = require("../functions/resetEmptyChannels");
const { activateGoblinEvent } = require("../functions/goblinEvent");
const { activateBirthdaySystem } = require("../functions/birthdaySystem");
const { adoptRootChannelUsers } = require("../functions/adoptRootChannelUsers");
const log4js = require("log4js");
const {} = require("../logger");
const appLogger = log4js.getLogger("client");

var activeGuilds = [];

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    // Remove empty Channels from cache.
    for (const guild of client.guilds.cache.values()) {
      try {
        await resetEmptyChannels(guild); //remove stuck chanels
        // חייב לרוץ אחרי הניקוי: משתמשים שנשארו בחדר היצירה מקבלים חדר משלהם
        await adoptRootChannelUsers(guild);
      } catch (err) {
        console.error(`[startup] טיפול בשרת ${guild.id} נכשל:`, err);
      }
      activateGoblinEvent(guild);
      activateBirthdaySystem(guild);
      activeGuilds.push({
        id: guild.id,
        name: guild.name,
      });
      appLogger.log("ready and logged in", {
        botID: client.user.tag,
        guildId: guild.id,
        guildName: guild.name,
      });
    }

    client.user.setActivity({
      name: "Brewing...",
      type: ActivityType.Custom,
    });

    await setGuildData("guilds", activeGuilds);
    //TODO remove data_guildId file if the guild is not listed
  },
};
