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

    //What if a user switches from one game to another? logically it should remove him from one activity, thus the length will -- and once joining a new activity it will ++
    try{
      if (!oldPresence.activities.length == newPresence.activities.length) {
          }
    }catch(e){

    }
    
  },
};
