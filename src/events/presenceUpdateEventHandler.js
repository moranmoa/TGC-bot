const { Events } = require("discord.js");

module.exports = {
  name: Events.PresenceUpdate,
  async execute(oldPresence, newPresence) {
    console.log(`In presenceUpdate event handler`);
    let uName;

    //Get username, the try catch here is to handle, login, logout activities which have null usernames
    try {
      uName = oldPresence.user.globalName;
    } catch (e) {
      uName = newPresence.user.globalName;
    }

    console.log(`User = ${uName}`);

    if (!oldPresence.activities.length == newPresence.activities.length) {
    }

    // user joined the Root channel to create a mew voice one,
    // we need to create the user a new channel, move that user to the channel

    // later on with database we should check if the user left the channel he created so we can delete it.
  },
};
