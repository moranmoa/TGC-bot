const { Events } = require("discord.js");
const log4js = require("log4js");
const {} = require("../logger");
const appLogger = log4js.getLogger("channel");

// // This sends the buttons to a newly automated created voice channel

module.exports = {
  name: Events.ChannelUpdate,
  async execute(channel) {
    console.log(`Channel Update: ID - ${channel.id}`);
    appLogger.log("Channel Name Update", {
      iD: channel.id,
      name: channel.name,
    });
  },
};
