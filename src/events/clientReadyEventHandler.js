const { Events, ActivityType } = require("discord.js");
const { setGuildData } = require("./activityUtils");
const { resetEmptyChannels } = require("../functions/resetEmptyChannels");
const log4js = require("log4js");
const {} = require("../logger");
const appLogger = log4js.getLogger("client");

var activeGuilds = [];

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    // Remove empty Channels from cache.
    client.guilds.cache.forEach((guild) => {
      resetEmptyChannels(guild); //remove stuck chanels
      activeGuilds.push({
        id: guild.id,
        name: guild.name,
      });
      appLogger.log("ready and logged in", {
        botID: client.user.tag,
        guildId: guild.id,
        guildName: guild.name,
      });
    });

    client.user.setActivity({
      name: "Brewing...",
      type: ActivityType.Custom,
    });

    setGuildData("guilds", activeGuilds);
    //TODO remove data_guildId file if the guild is not listed
  },
};
