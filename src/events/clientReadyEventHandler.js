const { Events } = require("discord.js");
const {getGuildData ,setGuildData} = require('./activityUtils');

var activeGuilds = [];

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`Ready! Logged in as ${client.user.tag}`);
    client.guilds.cache.forEach((guild) => {
      resetEmptyChannels(guild)//remove stuck chanels
      activeGuilds.push({
        "id": guild.id,
        "name": guild.name
      });
    });
    console.log("*******  Guilds List : ",activeGuilds);
    //TODO remove data_guildId file if the guild is not listed
  },
};


async function resetEmptyChannels(guild) {
  var guildData = await getGuildData(guild.id);

  // Filter out and delete empty channels
  guildData.aActiveChannels = guildData.aActiveChannels.filter((activeChannel) => {
    try {
      const channel = guild.channels.cache.get(activeChannel.id);
      if (channel.members.size == 0) {
        guild.channels
          .delete(activeChannel.id, "making room for new channels")
          // .then(console.log)
          .catch(console.error);
        return false; // Remove from the array
      }
    } catch (e) {
      guild.channels
        .delete(activeChannel.id, "making room for new channels")
        // .then(console.log)
        .catch(console.error);
      return false; // Remove from the array
    }
    return true; // Keep in the array
  });

  // Save the updated guildData if needed
  await setGuildData(guild.id, guildData);
}