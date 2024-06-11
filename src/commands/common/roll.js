const { SlashCommandBuilder } = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roll')
        .setDescription('Roll a random generated number')
        .addNumberOption(option =>
            option
                .setName('max')
                .setDescription('Enter maximum number')
                .setRequired(false)
        ),
        
    async execute(interaction) {
        let max = interaction.options.getNumber('max') || 100;
        const randomNumber = Math.floor(Math.random() * (max + 1));

        await interaction.reply(`roll ${max} : ${randomNumber}`);
    },
};