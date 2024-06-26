const { getGuildData } = require("../events/activityUtils");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, StreamType } = require('@discordjs/voice');
const path = require('path');
const { createReadStream } = require('fs');
const { selectSound } = require("./sounds");

async function goblinEvent(guild) {
  var guildData = await getGuildData(guild.id);
  console.log("goblinEvent")
  let membersCount = 0
  guildData.aActiveChannels = guildData.aActiveChannels.filter(
    (activeChannel) => {
      try {
        const channel = guild.channels.cache.get(activeChannel.id);
        membersCount += channel.members.size
      } catch (e) {
        return false; // Remove from the array
      }
      return true; // Keep in the array
    }
  );
  if(membersCount>1){
    console.log("goblin Event now")
    let numberofchannels = (Math.floor(guildData.aActiveChannels.length/2) +1)

    // const randomIndex = Math.floor(Math.random() * guildData.aActiveChannels.length);
    // const voiceChannel = guild.channels.cache.get(guildData.aActiveChannels[randomIndex].id);

    // // https://convertio.co/mp3-opus/
    // let url='../audio/'+ await selectSound("all")
    // await playInChannel(url,voiceChannel)
    let usedIndices = new Set();

    for (let i = 0; i < numberofchannels; i++) {
        setTimeout(async () => {
            let randomIndex;
            let count = 0
            do {
                count++
                if(count >10){
                    return
                }
                randomIndex = Math.floor(Math.random() * guildData.aActiveChannels.length);
            } while (usedIndices.has(randomIndex));
            
            usedIndices.add(randomIndex);
            const voiceChannel = guild.channels.cache.get(guildData.aActiveChannels[randomIndex].id);

            let url = '../audio/' + await selectSound("all");
            await playInChannel(url, voiceChannel);
        }, i * 10000); // 10000 milliseconds = 10 seconds
    }

  }
}

async function playInChannel(url, voiceChannel) {
    // Join the voice channel
    console.log("goblin Event playInChannel")
    let guild = voiceChannel.guild
    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
      });
  
      // Create an audio player
      const player = createAudioPlayer();
  
      // Path to the opus file
    //   https://convertio.co/mp3-opus/
      const filePath = path.join(__dirname, url);
  
      // Create a read stream for the opus file
      const resource = createAudioResource(createReadStream(filePath), {
        inputType: StreamType.OggOpus,
      });
  
      // Play the audio resource
      player.play(resource);
  
      // Subscribe the connection to the audio player (this means the bot will play audio in the voice channel)
      connection.subscribe(player);
  
      player.on(AudioPlayerStatus.Playing, () => {
        console.log('The audio player has started playing!');
      });
  
      player.on(AudioPlayerStatus.Idle, () => {
        console.log('The audio player is now idle!');
        connection.destroy(); // Leave the voice channel when the audio is finished
      });
  
      player.on('error', error => {
        console.error(`Error: ${error.message}`);
        connection.destroy();
      });
  }

function getRandomInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

async function activateGoblinEvent(guild) {
  var guildData = await getGuildData(guild.id);
  if(guildData.GoblinEvent){
    console.log("schedule Goblin Event")
    const minInterval = 20 * 60 * 1000; // 30 minutes in milliseconds
    const maxInterval = 4 * 60 * 60 * 1000; // 5 hours in milliseconds
    // const minInterval = 10 * 1 * 1000; // 30 minutes in milliseconds     //5sec - test
    // const maxInterval = 20 * 1 * 1 * 1000; // 5 hours in milliseconds    //10sec -test
    function scheduleGoblinEvent() {
        const interval = getRandomInterval(minInterval, maxInterval);
        setTimeout(async () => {
          await goblinEvent(guild);
          scheduleGoblinEvent(); // Schedule the next event
        }, interval);
      }
  
      scheduleGoblinEvent();
  }
}

module.exports = { activateGoblinEvent };
