const { SlashCommandBuilder } = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add')
        .setDescription('Adds two numbers.')
        .addNumberOption(option =>
            option
                .setName('first-number')
                .setDescription('Enter your first number')
        )
        .addNumberOption(option =>
            option
                .setName('second-number')
                .setDescription('Enter your second number')
        ),
        
    async execute(interaction){
        const num1= interaction.options.get('first-number').value
        const num2= interaction.options.get('second-number').value
        console.log(interaction)
        console.log(`Num 1 = ${num1}, Num 2 = ${num2}`)
        await interaction.reply(`This command was run by ${interaction.user.username}, who joined on ${interaction.member.joinedAt}.`);
    },
};