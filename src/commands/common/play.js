const {
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, StreamType } = require('@discordjs/voice');
const path = require('path');
const { createReadStream } = require('fs');

// TODO upgrade this command to play youtube and spotify

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play an audio file in your voice channel"),

  async execute(interaction) {
    const member = interaction.member;

    // Check if the user is in a voice channel
    if (!member.voice.channel) {
      return interaction.reply("You need to be in a voice channel to use this command!");
    }

    const voiceChannel = member.voice.channel;

    // Join the voice channel
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: interaction.guild.id,
      adapterCreator: interaction.guild.voiceAdapterCreator,
    });

    // Create an audio player
    const player = createAudioPlayer();

    // Path to the opus file
    const filePath = path.join(__dirname, '../../audio/Treasure-Goblin.opus');

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

    await interaction.reply(`Playing audio in ${voiceChannel.name}`);
  },
};

//this code needs to Installing FFmpeg 
// 1 Download FFmpeg from the official website. https://ffmpeg.org/download.html
// 2 Extract the archive and add the bin directory to your system's PATH.

// const {
//   SlashCommandBuilder,
//   PermissionFlagsBits,
// } = require("discord.js");
// const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, StreamType } = require('@discordjs/voice');
// const { createReadStream } = require('fs');
// const { pipeline } = require('stream');
// const prism = require('prism-media');
// const path = require('path');

// module.exports = {
//   data: new SlashCommandBuilder()
//     .setName("play")
//     .setDescription("play .mp3 file in your voice channel"),

//   async execute(interaction) {
//     const member = interaction.member;
//     await interaction.reply(`Playing .mp3 in `);


//     // Check if the user is in a voice channel
//     if (!member.voice.channel) {
//       return interaction.reply("You need to be in a voice channel to use this command!");
//     }

//     const voiceChannel = member.voice.channel;

//     // Join the voice channel
//     const connection = joinVoiceChannel({
//       channelId: voiceChannel.id,
//       guildId: interaction.guild.id,
//       adapterCreator: interaction.guild.voiceAdapterCreator,
//     });

//     // Create an audio player
//     const player = createAudioPlayer();

//     // Path to the mp3 file
//     const filePath = path.join(__dirname, '../../audio/Treasure Goblin.mp3');

//     // Create a read stream for the mp3 file
//     const readStream = createReadStream(filePath);

//     // Create a transcoder stream using prism-media
//     const transcoder = new prism.FFmpeg({
//       args: [
//         '-analyzeduration', '0',
//         '-loglevel', '0',
//         '-f', 's16le',
//         '-ar', '48000',
//         '-ac', '2',
//       ],
//     });

//     // Pipe the read stream through the transcoder to create an audio resource
//     const stream = pipeline(readStream, transcoder, (err) => {
//       if (err) {
//         console.error('Pipeline failed.', err);
//       }
//     });

//     const resource = createAudioResource(stream, {
//       inputType: StreamType.Raw,
//     });

//     // Play the audio resource
//     player.play(resource);

//     // Subscribe the connection to the audio player (this means the bot will play audio in the voice channel)
//     connection.subscribe(player);

//     player.on(AudioPlayerStatus.Playing, () => {
//       console.log('The audio player has started playing!');
//     });

//     player.on(AudioPlayerStatus.Idle, () => {
//       console.log('The audio player is now idle!');
//       connection.destroy(); // Leave the voice channel when the audio is finished
//     });

//     player.on('error', error => {
//       console.error(`Error: ${error.message}`);
//       connection.destroy();
//     });

//     await interaction.reply(`Playing .mp3 in ${voiceChannel.name}`);
//   },
// };