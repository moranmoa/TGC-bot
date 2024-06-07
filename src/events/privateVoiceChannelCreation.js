const { Events, ChannelType, VoiceChannel } = require("discord.js");
const path = require("node:path");
var aActiveChanels = []
  // aActiveChanels [
  //   {id:"001",
  //   users:[didiID],
  //   master:didiID
  // },
  // {id:"002",
  //   users:[moaID,cosmosID],
  //   master:moaID
  // }]

module.exports = {
  name: Events.VoiceStateUpdate,
  async execute(oldState, newState, client) {
    const rootChannelId = "1248622632182480991";
    const newChannel = newState.channelId;
    const oldChannel = oldState.channelId;
    if(newChannel != oldChannel){
      if (newChannel == rootChannelId) {
        // Users entered 1248622632182480991 - Create A Party 🔊
        try {
          const genNewChannel = await newState.guild.channels.create({
            name: "test-channel",
            type: ChannelType.GuildVoice,
            parent: newState.channel.parent,
          });

          newState.setChannel(genNewChannel);
          var currentChanel ={id:genNewChannel.id,
            users:[newChannel.id],
            master:newChannel.id
          }
          aActiveChanels.push(currentChanel)
          return

        } catch (error) {
          console.log(
            `Error in privateVoiceChannelCreation event Handler\n ${error}`
          );
        }
      }
    
       //add user if join to voice
      var index = aActiveChanels.findIndex(chanel => chanel.id === newChannel);
      if (index !== -1) {
        aActiveChanels[index].users.push(newState.id)
      }
      //remove user if leve voice
      var index = aActiveChanels.findIndex(chanel => chanel.id === oldChannel);
      if (index !== -1) {
        var Userindex = aActiveChanels[index].users.findIndex(user => user === oldState.id);
        if (Userindex !== -1) {
          aActiveChanels[index].users.splice(Userindex, 1)//remove
          if(aActiveChanels[index].users.length<=0){
            aActiveChanels.splice(index, 1)
            return
          }
          if(oldState.id == aActiveChanels[index].master){
            aActiveChanels[index].master = aActiveChanels[index].users[0];
            //set new master
          }
        }
      }
    }
    
    console.log(
      `Voice State Update Catch, but user didn't enter the Root Channel`
    );

    // user joined the Root channel to create a mew voice one,
    // we need to create the user a new channel, move that user to the channel

    // later on with database we should check if the user left the channel he created so we can delete it.
  },
};


        