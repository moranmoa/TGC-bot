const { Events } = require("discord.js");
const { getActivityName,whatName ,getGuildData,setGuildData,updateChannelName} = require('./activityUtils');

module.exports = {
  name: Events.PresenceUpdate,
  async execute(oldPresence, newPresence) {
    // console.log(`In presenceUpdate event handler`);
    
    let aActiveChannels
    if (newPresence && newPresence.guild ){
      const guild = newPresence.guild;
      var guildData = await getGuildData(guild.id);
      if(!guildData.aActiveChannels){
        guildData.aActiveChannels = []
      }
      aActiveChannels = guildData.aActiveChannels
      // if(aActiveChannels){
      aActiveChannels.forEach(ActiveChannel => {
        if(ActiveChannel.master == newPresence.userId){
          const newName = getActivityName(newPresence.member)
          const voceChannel = newPresence.guild.channels.cache.get(ActiveChannel.id)
          if(whatName(ActiveChannel.name,newName)){
            console.log("********** voice changing name to ",newName.name)
            ActiveChannel.name=newName
            setGuildData(guild.id, guildData)
            // updateChannelName(voceChannel, guildData, newName) crush the app
            voceChannel.edit({name:newName.name}).then((voceChannel) =>{
              if(voceChannel){
                console.log("********** voceChannel name is ",voceChannel.name)
              }
              
            }
            )
            .catch(console.error);
            
          }
          
        }
      });
      
    }
    
  },
};
