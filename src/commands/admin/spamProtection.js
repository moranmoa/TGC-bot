const { SlashCommandBuilder } = require('discord.js')
const {getGuildData ,setGuildData} = require('../../events/activityUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spamprotection')
        .setDescription('enable or disable spam protection')
        .addBooleanOption(option =>
            option
                .setName('enable')
                .setDescription('enable or disable Spam protection')
        ),
        
    async execute(interaction){
        const enable= interaction.options.get('enable').value
        let guild = interaction.guild;
        var guildData = await getGuildData(guild.id);
        guildData.SpamProtection = enable
        await setGuildData(guild.id, guildData)
        // console.log(interaction)
        // console.log(`Num 1 = ${num1}, Num 2 = ${num2}`)
        await interaction.reply(`Spam protection ${enable ? 'enabled' : 'disabled'}`);
    },
};