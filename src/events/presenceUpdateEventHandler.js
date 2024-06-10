const { Events } = require("discord.js");
const { getActivityName } = require('./activityUtils');

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
    }
    
  },
};
