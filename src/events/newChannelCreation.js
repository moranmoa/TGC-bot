const { Events } = require("discord.js");
const { sendButtons } = require("../functions/voiceChannelButtons");
const { getGuildData } = require("../events/activityUtils");

// This sends the buttons to a newly automated created voice channel

module.exports = {
  name: Events.ChannelCreate,
  async execute(channel) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    // we must wait few seconds before reading the file, if not we might read a NULL one.

    var guildData = await getGuildData(channel.guildId);
    console.log(`Guild DATA = ${guildData}`);
    let index = guildData.aActiveChannels.findIndex(
      (data) => data.id === channel.id
    );

    console.log(`the index is ${index}`);
    if (index !== -1) {
      console.log(`New Channel Created: ${channel.id}`);
      sendButtons(channel);
    }
  },
};
