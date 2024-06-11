const { Events } = require("discord.js");
// const { sendButtons } = require("../functions/voiceChannelButtons");
// const { getGuildData } = require("./activityUtils");
const log4js = require("log4js");
const {} = require("../logger");
const appLogger = log4js.getLogger("channel");

// // This sends the buttons to a newly automated created voice channel

module.exports = {
  name: Events.ChannelCreate,
  async execute(channel) {
    console.log(channel);
    appLogger.log("New Channel Created", {
      iD: channel.id,
      name: channel.name,
    });

    // await new Promise((resolve) => setTimeout(resolve, 1000)); // wait 1 second
    // we must wait few seconds before reading the file, if not we might read a NULL one.
    // var guildData = await getGuildData(channel.guildId);
    // let index = guildData.aActiveChannels.findIndex(
    //   (data) => data.id === channel.id
    // );
    // if (index !== -1) {
    //   sendButtons(channel);
    // }
  },
};
