const { Events } = require("discord.js");

var activeGuilds = [];

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`Ready! Logged in as ${client.user.tag}`);

    let guildCache = client.guilds.cache;
    for (const [key, value] of guildCache) {
      activeGuilds.push(value);
    }
    console.log(`Guilds List: ${activeGuilds}`);
  },
};
