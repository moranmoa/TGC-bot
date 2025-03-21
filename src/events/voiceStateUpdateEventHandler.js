const { Events, ChannelType, VoiceChannel } = require("discord.js");
const path = require("node:path");
const { getActivityName ,whatName ,getGuildData ,setGuildData} = require('./activityUtils');
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
    const guild = oldState?.guild ?? newState?.guild;
    var guildData = await getGuildData(guild.id);
    // guildData.rootChannelId = ["1012355807209332820"]
    // await setGuildData(guild.id, guildData)
    // const rootChannelId = ["1248622632182480991","1012355807209332820"];
    const newChannel = newState.channelId;
    const oldChannel = oldState.channelId;
    // if (newState&& newState.guild){
    // if(!guildData.aActiveChannels){
    //   guildData.aActiveChannels = []
    // }
    // }
    if (newChannel != oldChannel) {
      if (guildData.rootChannelId.includes(newChannel)) {
        
        // Users entered 1248622632182480991 - Create A Party 🔊
        try {
          console.log("***** create New Channel");
          let name = getActivityName(newState.member);
          // let channelscollection = newState.channel.parent.children.cache
          // let array = Array.from(channelscollection);
          // let index = array.findIndex(subArray => subArray[0] === newState.channel.id);
          // const desiredPosition = index + 1;
          // console.log("desiredPosition = ",desiredPosition)
          const genNewChannel = await newState.guild.channels.create({
            name: name.name,
            type: ChannelType.GuildVoice,
            parent: newState.channel.parent,
            //position: desiredPosition, // Place at specified position
          });
          try{
            newState.setChannel(genNewChannel);
            var currentChanel = {
              id: genNewChannel.id,
              users: [],
              master: newState.id,
              name:name
            };
          }catch (e){
            console.log("****** error ",e);
          }
          
          guildData.aActiveChannels.push(currentChanel);
          await setGuildData(guild.id, guildData)
          // console.log("***** aActiveChannels ", guildData.aActiveChannels);
        } catch (error) {
          console.log(
            `Error in privateVoiceChannelCreation event Handler\n ${error}`
          );
        }
      }
      
      //add user if join to voice
      if(newState && newState.guild && guildData.aActiveChannels){
        var index = guildData.aActiveChannels.findIndex(
          (chanel) => chanel.id === newChannel
        );
        console.log("***** index Channel :", index);
        if (index !== -1) {
          guildData.aActiveChannels[index].users.push(newState.id);
          await setGuildData(guild.id, guildData)
          // console.log("***** aActiveChannels ", guildData.aActiveChannels);
        }
      }
      
      //remove user if left voice
      if(oldState && oldState.id){
        var index = guildData.aActiveChannels.findIndex(
          (chanel) => chanel.id === oldChannel
        );
        // console.log("***** index old Channel :", index);
        if (index !== -1) {
          var userIndex = guildData.aActiveChannels[index].users.findIndex(
            (user) => user === oldState.id
          );
          if (userIndex !== -1) {
            guildData.aActiveChannels[index].users.splice(userIndex, 1); //remove
            await setGuildData(guild.id, guildData)
            if (guildData.aActiveChannels[index].users.length <= 0) {
              try{
                oldState.guild.channels
                .delete(oldChannel, "making room for new channels")
                .then(console.log)
                .catch(console.error);
              }catch(e){
                onsole.log("***** error ", e);
              }
                guildData.aActiveChannels.splice(index, 1);
                await setGuildData(guild.id, guildData)
              // console.log("***** aActiveChannels ", guildData.aActiveChannels);
              return;
            }
            if (oldState.id == guildData.aActiveChannels[index].master) {
              guildData.aActiveChannels[index].master = guildData.aActiveChannels[index].users[0];
              let memberscollection = oldState.channel.members
              let member = memberscollection.get(guildData.aActiveChannels[index].master)
              if(member){
                const newName = getActivityName(member)
                // if(whatName(guildData.aActiveChannels[index].name,newName)){
                if(guildData.aActiveChannels[index].name != newName){
                  guildData.aActiveChannels[index].name=newName
                  try{
                    oldState.channel.edit({name:newName.name})
                  }catch( e ){
                    console.log("**** error ", e);
                  }
                }
              }
              await setGuildData(guild.id, guildData)
              // console.log("***** aActiveChannels ", guildData.aActiveChannels);
            }
          }
        }
      }
    }
  },
};
