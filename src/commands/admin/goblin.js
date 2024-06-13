const { SlashCommandBuilder } = require('discord.js')
const {getGuildData ,setGuildData} = require('../../events/activityUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('goblin')
        .setDescription('activate Goblin spawn event')
        .addBooleanOption(option =>
            option
                .setName('enable')
                .setDescription('enable or desable Goblin spawn event')
        ),
        
    async execute(interaction){
        const enable= interaction.options.get('enable').value
        let guild = interaction.guild;
        var guildData = await getGuildData(guild.id);
        guildData.GoblinEvent = enable
        await setGuildData(guild.id, guildData)
        // console.log(interaction)
        // console.log(`Num 1 = ${num1}, Num 2 = ${num2}`)
        await interaction.reply(`Goblin spawn event enabled ${enable}`);
    },
};