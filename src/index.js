require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");

const {
  Client,
  IntentsBitField,
  Collection,
  GatewayIntentBits,
  Message,
  PresenceManager,
  Presence,
  VoiceStateManager,
  ChannelType,
} = require("discord.js");

// Construct a new Client connection that mocks with all Guild rules.
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildVoiceStates,
    IntentsBitField.Flags.GuildVoiceStates,
    IntentsBitField.Flags.GuildPresences,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.Guilds,
  ],
});

client.commands = new Collection();
const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}

const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

// Client.on voiceStateUpdate

// client.on("voiceStateUpdate", async (oldState, newState) => {
//   const rootChannelId = "1248622632182480991";
//   const channelId = newState.channelId;
//   const userId = newState.member.user.globalName;

// if (newState.channelId == rootChannelId) {
//   const channel = await newState.guild.channels.create({
//     name: "test-dudi",
//     type: ChannelType.GuildVoice,
//     parent: newState.channel.parent,
//   });

//   newState.setChannel(channel);
// }
// });

// client.on("messageCreate", (message) => {
//   console.log(message);
// });

client.on("presenceUpdate", (a, b) => {
  // Combines with voiceStateUpdate, should check if the user is the "admin" of the current Voice chat, if so and his activity was changed, update the Channel

  try {
    if (a.user.bot || a.user === "null") return;
    const uname = a.user.globalName;
    // console.log(uname);
    if (uname === "MoA") console.log(b);
    // console.log(a,b)
  } catch (err) {
    console.log(err);
  }
});

client.on("voiceStateUpdate", (a, b) => {
  try {
    // console.log(a.member.user.globalName);
    // If we are in the Global Voice Channel ID, we need to create a new channel, Transfer the user to the new channel, change the channel name to the latest activity (if any).
    // User which creates the channel gets an admin ROLE on the channel itself.
    // const args = message.content.split(' ');
    // const memberId = args[1].replace(/[<@!>]/g, '');  // Remove formatting from mention
    // const channelName = args.slice(2).join(' ');
    // const member = message.guild.members.cache.get(memberId);
    // if (!member) {
    //     message.channel.send('Member not found.');
    //     return;
    // }
    // // Check if the bot has the necessary permissions
    // if (!message.guild.me.permissions.has('MANAGE_CHANNELS') || !message.guild.me.permissions.has('MOVE_MEMBERS')) {
    //     message.channel.send("I don't have permission to manage channels or move members.");
    //     return;
    // }
    // try {
    //     // Create a voice channel
    //     const newChannel = await message.guild.channels.create(channelName, {
    //         type: 'GUILD_VOICE',
    //     });
    //     message.channel.send(Created a new voice channel: ${newChannel.name});
    //     // Move the member to the new voice channel
    //     if (member.voice.channel) {
    //         await member.voice.setChannel(newChannel);
    //         message.channel.send(Moved ${member.displayName} to ${newChannel.name});
    //     } else {
    //         message.channel.send(${member.displayName} is not in a voice channel.);
    //     }
    // } catch (error) {
    //     console.error(error);
    //     message.channel.send('An error occurred while creating the channel or moving the member.');
    // }
  } catch (err) {
    console.log(err);
  }
});

client.login(process.env.TOKEN);
