const { REST, Routes } = require("discord.js");
require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(process.env.TOKEN);

const commandId = "";

rest
  .delete(
    Routes.applicationGuildCommand(
      process.env.BOT_ID,
      process.env.GUILD_ID,
      commandId
    )
  )
  .then(() => console.log("Successfully deleted guild command"))
  .catch(console.error);
