const { getGuildData, setGuildData } = require("../events/activityUtils");

async function resetEmptyChannels(guild) {
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
    }
  );

  // Save the updated guildData if needed
  await setGuildData(guild.id, guildData);
}

module.exports = { resetEmptyChannels };
