const { Events } = require("discord.js");

var activeGuilds = [];
var activeGuildsIds = [];

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`Ready! Logged in as ${client.user.tag}`);
    client.guilds.cache.forEach((element) => {
      let tempGuildName = element.name;
      let tempGuildId = element.id;
      if (!activeGuilds.includes(tempGuildName)) {
        console.log(`guild not in list, adding... ${tempGuildName}`);
        activeGuilds.push(tempGuildName);
        activeGuildsIds.push(tempGuildId);
      }
    });
    console.log(`*******  Guilds List [Names]: ${activeGuilds}`);
    console.log(`*******  Guilds List [Ids]: ${activeGuilds}`);
  },
};
