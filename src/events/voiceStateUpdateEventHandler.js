const { Events, ChannelType, VoiceChannel } = require("discord.js");
const path = require("node:path");
var aActiveChannels = [];
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
    const rootChannelId = "1248622632182480991";
    const newChannel = newState.channelId;
    const oldChannel = oldState.channelId;
    console.log(
      "********************************* aActiveChannels ",
      aActiveChannels
    );
    if (newChannel != oldChannel) {
      if (newChannel == rootChannelId) {
        // Users entered 1248622632182480991 - Create A Party 🔊
        try {
          console.log("***** create New Channel");
          let activityName;
          let customStatusName;
          try {
            let activities = newState.member.presence.activities;
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
          activityName = activityName
            ? activityName
            : newState.member.user.globalName; //else username
          const name = activityName;
          // try{activityName = newState.member.presence.activities[1].name}
          // catch(e){
          //   activityName = newState.member.presence.activities.find(activity => activity.type === 'CUSTOM_STATUS');
          //   if(!activityName){
          //     activityName = newState.member.user.globalName
          //   }

          // }
          const genNewChannel = await newState.guild.channels.create({
            name: name,
            type: ChannelType.GuildVoice,
            parent: newState.channel.parent,
          });

          newState.setChannel(genNewChannel);
          var currentChanel = {
            id: genNewChannel.id,
            users: [],
            master: newState.id,
          };
          aActiveChannels.push(currentChanel);
          console.log("***** aActiveChannels ", aActiveChannels);
        } catch (error) {
          console.log(
            `Error in privateVoiceChannelCreation event Handler\n ${error}`
          );
        }
      }

      //add user if join to voice
      var index = aActiveChannels.findIndex(
        (chanel) => chanel.id === newChannel
      );
      console.log("***** index new Channel :", index);
      if (index !== -1) {
        aActiveChannels[index].users.push(newState.id);
        console.log("***** aActiveChannels ", aActiveChannels);
      }
      //remove user if left voice
      var index = aActiveChannels.findIndex(
        (chanel) => chanel.id === oldChannel
      );
      console.log("***** index old Channel :", index);
      if (index !== -1) {
        var userIndex = aActiveChannels[index].users.findIndex(
          (user) => user === oldState.id
        );
        if (userIndex !== -1) {
          aActiveChannels[index].users.splice(userIndex, 1); //remove
          if (aActiveChannels[index].users.length <= 0) {
            oldState.guild.channels
              .delete(oldChannel, "making room for new channels")
              .then(console.log)
              .catch(console.error);
            aActiveChannels.splice(index, 1);
            console.log("***** aActiveChannels ", aActiveChannels);
            return;
          }
          if (oldState.id == aActiveChannels[index].master) {
            aActiveChannels[index].master = aActiveChannels[index].users[0];
            console.log("***** aActiveChannels ", aActiveChannels);
            //set new master
          }
        }
      }
    }

    // console.log(
    //   `Voice State Update Catch, but user didn't enter the Root Channel`
    // );

    // user joined the Root channel to create a mew voice one,
    // we need to create the user a new channel, move that user to the channel

    // later on with database we should check if the user left the channel he created so we can delete it.
  },
};
