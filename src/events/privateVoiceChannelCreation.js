const { Events, ChannelType, VoiceChannel } = require("discord.js");
const path = require("node:path");

module.exports = {
  name: Events.VoiceStateUpdate,
  async execute(oldState, newState, client) {
    const rootChannelId = "1248622632182480991";
    const newChannel = newState.channelId;

    if (newChannel == rootChannelId) {
      // Users entered 1248622632182480991 - Create A Party 🔊
      try {
        const genNewChannel = await newState.guild.channels.create({
          name: "test-channel",
          type: ChannelType.GuildVoice,
          parent: newState.channel.parent,
        });
        newState.setChannel(genNewChannel);
      } catch (error) {
        console.log(
          `Error in privateVoiceChannelCreation event Handler\n ${error}`
        );
      }
    }
    console.log(
      `Voice State Update Catch, but user didn't enter the Root Channel`
    );

    // user joined the Root channel to create a mew voice one,
    // we need to create the user a new channel, move that user to the channel

    // later on with database we should check if the user left the channel he created so we can delete it.
  },
};
