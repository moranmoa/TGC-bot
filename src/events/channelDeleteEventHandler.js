const { Events } = require("discord.js");
// const { sendButtons } = require("../functions/voiceChannelButtons");
// const { getGuildData } = require("./activityUtils");
const log4js = require("log4js");
const {} = require("../logger");
const appLogger = log4js.getLogger("channel");

// // This sends the buttons to a newly automated created voice channel

module.exports = {
  name: Events.ChannelDelete,
  async execute(channel) {
    appLogger.log("A Channel was deleted", {
      iD: channel.id,
      name: channel.name,
    });
  },
};
