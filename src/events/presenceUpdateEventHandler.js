const { Events } = require("discord.js");

function getActivityName(User) {
  let activityName;
  let customStatusName;
  try {
    let activities = User.presence.activities;
    if (activities && activities.length) {
      activities.forEach((activity) => {
        switch (activity.type) {
          case 0: //'Hang Status'
            activityName = activity.name;
            break;
          case 4: //status
            customStatusName = activity.state;
            break;
          case 6: //'Hang Status'
            break;
        }
      });
    }
  } catch (e) {}
  activityName = activityName ? activityName : customStatusName; //if name or status
  activityName = activityName ? activityName : User.user.globalName; //else username

  return activityName;
}

module.exports = {
  name: Events.PresenceUpdate,
  async execute(oldPresence, newPresence) {
    // console.log(`In presenceUpdate event handler`);
    let aActiveChannels
    if (newPresence){
      aActiveChannels = newPresence.guild.aActiveChannels
      if(aActiveChannels){
        aActiveChannels.forEach(Channel => {
          if(Channel.master == newPresence.userId){
            const newName = getActivityName(newPresence.member)
            console.log("********** voice changing name to ",newName)
            const channel = newPresence.guild.channels.cache.get(Channel.id)
            channel.edit({name:newName})
          }
        });
      }
    }
    // let uName;

    //Get username, the try catch here is to handle, login, logout activities which have null usernames
    // try {
    //   uName = oldPresence.user.globalName;
    // } catch (e) {
    //   uName = newPresence.user.globalName;
    // }

    // console.log(`User = ${uName}`);

    //What if a user switches from one game to another? logically it should remove him from one activity, thus the length will -- and once joining a new activity it will ++
    // try{
    //   if (!oldPresence.activities.length == newPresence.activities.length) {
    //       }
    // }catch(e){

    // }
    
  },
};
