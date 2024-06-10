const { Events, ChannelType, VoiceChannel } = require("discord.js");
const path = require("node:path");
const { getActivityName ,whatName} = require('./activityUtils');
// var aActiveChannels = [];
// aActiveChannels [
//   {id:"001",
//   users:[dudiID],
//   master:dudiID
// },
// {id:"002",
//   users:[moaID,cosmosID],
//   master:moaID
// }]



module.exports = {
  name: Events.VoiceStateUpdate,
  async execute(oldState, newState, client) {
    const rootChannelId = ["1248622632182480991","1012355807209332820"];
    const newChannel = newState.channelId;
    const oldChannel = oldState.channelId;
    if (newState&& newState.guild){
      if(!newState.guild.aActiveChannels){
        newState.guild.aActiveChannels = []
      }
    }
    if (newChannel != oldChannel) {
      if (rootChannelId.includes(newChannel)) {
        
        // Users entered 1248622632182480991 - Create A Party 🔊
        try {
          console.log("***** create New Channel");
          const name = getActivityName(newState.member);
          const genNewChannel = await newState.guild.channels.create({
            name: name.name,
            type: ChannelType.GuildVoice,
            parent: newState.channel.parent,
          });

          newState.setChannel(genNewChannel);
          var currentChanel = {
            id: genNewChannel.id,
            users: [],
            master: newState.id,
            name:name
          };
          newState.guild.aActiveChannels.push(currentChanel);
          console.log("***** aActiveChannels ", newState.guild.aActiveChannels);
        } catch (error) {
          console.log(
            `Error in privateVoiceChannelCreation event Handler\n ${error}`
          );
        }
      }

      //add user if join to voice
      if(newState && newState.guild && newState.guild.aActiveChannels){
        var index = newState.guild.aActiveChannels.findIndex(
          (chanel) => chanel.id === newChannel
        );
        console.log("***** index new Channel :", index);
        if (index !== -1) {
          newState.guild.aActiveChannels[index].users.push(newState.id);
          console.log("***** aActiveChannels ", newState.guild.aActiveChannels);
        }
      }
      
      //remove user if left voice
      if(oldState){
        var index = oldState.guild.aActiveChannels.findIndex(
          (chanel) => chanel.id === oldChannel
        );
        console.log("***** index old Channel :", index);
        if (index !== -1) {
          var userIndex = oldState.guild.aActiveChannels[index].users.findIndex(
            (user) => user === oldState.id
          );
          if (userIndex !== -1) {
            oldState.guild.aActiveChannels[index].users.splice(userIndex, 1); //remove
            if (oldState.guild.aActiveChannels[index].users.length <= 0) {
              oldState.guild.channels
                .delete(oldChannel, "making room for new channels")
                .then(console.log)
                .catch(console.error);
                oldState.guild.aActiveChannels.splice(index, 1);
              console.log("***** aActiveChannels ", oldState.guild.aActiveChannels);
              return;
            }
            if (oldState.id == oldState.guild.aActiveChannels[index].master) {
              oldState.guild.aActiveChannels[index].master = oldState.guild.aActiveChannels[index].users[0];
              let memberscollection = oldState.channel.members
              let member = memberscollection.get(oldState.guild.aActiveChannels[index].master)
              // memberscollection.forEach((member)=>{
                // if(member.id == oldState.guild.aActiveChannels[index].master){
              if(member){
                const newName = getActivityName(member)
                if(whatName(oldState.guild.aActiveChannels[index].name,newName)){
                  oldState.guild.aActiveChannels[index].name=newName
                  oldState.channel.edit({name:newName.name})
                }
              }
              // })
              console.log("***** aActiveChannels ", oldState.guild.aActiveChannels);
              //set new master
            }
          }
        }
      }
    }
  },
};
