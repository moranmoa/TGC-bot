const { Events } = require("discord.js");

function getActivityName(User) {
  let activityName;
  let customStatusName;
  try {
    let activities = User.presence.activities;
    if (activities && activities.length) {
      activities.forEach((activity) => {
        console.log("********** activity ",activity.name," ",activity.state," ",activity.type)
        switch (activity.type) {
          case 0: //'Hang Status'
            activityName = {"name": '\u{1F3AE}' +activity.name,
              "type":activity.type
            };
            break;
          case 4: //status
            customStatusName = {"name": '\u{1F4AC}'+activity.state,
              "type":activity.type
            };
            break;
          case 6: //'Hang Status'
            break;//U+1F464
        }
      });
    }
  } catch (e) {}
  activityName = activityName ? activityName : customStatusName; //if name or status
  activityName = activityName ? activityName : {"name": '\u{1F464}'+User.user.globalName,"type":6}; //else username

  return activityName;
}

module.exports = {
  name: Events.PresenceUpdate,
  async execute(oldPresence, newPresence) {
    // console.log(`In presenceUpdate event handler`);
    let aActiveChannels
    if (newPresence && newPresence.guild && newPresence.guild.aActiveChannels){
      aActiveChannels = newPresence.guild.aActiveChannels
      // if(aActiveChannels){
      aActiveChannels.forEach(ActiveChannel => {
        if(ActiveChannel.master == newPresence.userId){
          const newName = getActivityName(newPresence.member)
          const voceChannel = newPresence.guild.channels.cache.get(ActiveChannel.id)
          if(ActiveChannel.name.type >= newName.type && ActiveChannel.name.name != newName.name){
            console.log("********** voice changing name to ",newName.name)
            ActiveChannel.name=newName
            voceChannel.edit({name:newName.name}).then((voceChannel) =>
              console.log("********** voceChannel name is ",voceChannel.name)
            )
            .catch(console.error);
          }
          
        }
      });
      // }
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
