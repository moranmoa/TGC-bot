const { REST, Routes } = require("discord.js");
require("dotenv").config();

const rest = new REST().setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('Started deleting all guild commands.');

    // שליחת מערך פקודות ריק דורסת את הקיים ומוחקת את כל הפקודות בשרת
    await rest.put(
      Routes.applicationGuildCommands(process.env.BOT_ID, process.env.GUILD_ID),
      { body: [] },
    );

    console.log('Successfully deleted all guild commands.');
  } catch (error) {
    console.error(error);
  }
})();