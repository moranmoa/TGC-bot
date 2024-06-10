const { Guild } = require('discord.js');
const path = require('path');
const fs = require('fs').promises;

const dataDirPath = path.join(__dirname, '..', 'data');

async function getGuildData(guildId) {
    try {
        const filePath = path.join(dataDirPath, `data_${guildId}.json`);
        const jsonString = await fs.readFile(filePath, 'utf8');
        const data = JSON.parse(jsonString);
        // console.log("* Guild Data * :",guildId,data)
        return data;
    } catch (err) {
        // console.error('Error reading or parsing file', err);
        return {"aActiveChannels":[]};
    }
}
async function setGuildData(guildId, data) {
    // Convert JSON object to string
    const jsonData = JSON.stringify(data, null, 2);

    try {
        const filePath = path.join(dataDirPath, `data_${guildId}.json`);
        // Write JSON string to a file
        await fs.writeFile(filePath, jsonData);
        console.log('JSON data written to file successfully');
    } catch (err) {
        console.error('Error writing to file', err);
    }
}

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

  module.exports = {getActivityName ,whatName, getGuildData ,setGuildData};