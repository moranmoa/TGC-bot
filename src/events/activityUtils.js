const { Guild } = require('discord.js');
const path = require('path');
const fs = require('fs').promises;

// const dataDirPath = path.join(__dirname, '..', 'data');
const dataDirPath = '/app/data';

async function getGuildData(guildId) {
    try {
        const filePath = path.join(dataDirPath, `data_${guildId}.json`);
        const jsonString = await fs.readFile(filePath, 'utf8');
        const data = JSON.parse(jsonString);
        // console.log("* Guild Data * :",guildId,data)
        return data;
    } catch (err) {
        console.error('**@@@@@ Error @@@ Error @@@ Error @@@@@@****** Error reading or parsing file ******* \n', err);
        return {"aActiveChannels":[],"rootChannelId":[]};
    }
}
async function setGuildData(guildId, data) {
    // Convert JSON object to string
    const jsonData = JSON.stringify(data, null, 2);

    try {
        const filePath = path.join(dataDirPath, `data_${guildId}.json`);
        // Write JSON string to a file
        await fs.writeFile(filePath, jsonData);
        console.log('@@@@@@@@@@ data for guildId :',guildId ,"\n", jsonData);
    } catch (err) {
        console.error('**@@@@@ Error @@@ Error @@@ Error @@@@****** Error writing to file **@@@@@@@@@@@@@@@@******\m', err);
    }
}

function getActivityName(User) {
    let activityName;
    let customStatusName;
    try {
      let activities = User.presence.activities;
      if (activities && activities.length) {
        activities.forEach((activity) => {
          console.log("**** activity ",activity.name," ",activity.state," ",activity.type)
          switch (activity.type) {
            case 0: //'Game'
              activityName = {"name": '\u{1F3AE}' +activity.name,
                "type":activity.type
              };
              break;
            case 4: //status
              customStatusName = {"name": '\u{1F4AC}'+ activity.state,//U+1F4AC
                "type":activity.type
              };
              break;
            case 6: //'Hang Status'
              break;
          }
        });
      }
    } catch (e) {}
    activityName = activityName ? activityName : customStatusName; //if name or status
    activityName = activityName ? activityName : {"name": '\u{1F464}'+User.user.globalName,"type":6}; //else username
  
    return activityName;
  }

  function whatName(currentActivityName,newActivityName){
    if(currentActivityName.name == newActivityName.name){
        return false
    }
    if(newActivityName.type==0 || currentActivityName.type!=0){
        return true
    }else{
        return false
    }
  }

  function updateChannelName(voiceChannel, guildData, newName ) {
    //not tested !!
    // dont works
    const channel = guildData.aActiveChannels.find(c => c.id === voiceChannel.id);
    if (!channel) {
        return;
    }
    const now = Date.now();
    if (channel.names.fifo.length >= 2) {
        const timeDiff = now - channel.names.fifo[0].time;
        const tenMinutes = 10 * 60 * 1000; //10min
        if (timeDiff < tenMinutes) {
            const remainingTime = tenMinutes - timeDiff;
            channel.names.fifo[2] = { name: newName.name, time: now + remainingTime };
            console.log("--updateChannelName ",channel , newName )
            if (!channel.names.timeoutId) {
                channel.names.timeoutId = setTimeout(() => {
                    console.log("--updateChannelName setTimeout 1",channel , newName )
                    channel.names.active = { name: channel.names.fifo[2].name, type: fifo[2].type };
                    channel.names.timeoutId = null;
                    if (channel.names.fifo.length > 2) {
                        channel.names.fifo.shift();
                    }
                    console.log("--updateChannelName setTimeout 2",channel , newName )
                }, remainingTime);
                channel.names.timeoutId = true;
            }
        } else {
            channel.names.active = { name: newName.name, type: newName.type };
            channel.names.fifo[2] = { name: newName.name, time: now ,type: newName.type};
            channel.names.fifo.shift();
            console.log("--updateChannelName ",channel , newName )
        }
    } else {
        channel.names.active = { name: newName.name, type: newName.type };
        channel.names.fifo.push({ name: newName.name, time: now ,type: newName.type});
        console.log("--updateChannelName ",channel , newName )
    }
}

  module.exports = {getActivityName ,whatName, getGuildData ,setGuildData, updateChannelName};