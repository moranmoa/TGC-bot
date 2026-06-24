const { getGuildData, getMessagesData, setMessagesData } = require('../events/activityUtils');

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (message.author.bot) return;

        try {
            const guildId = message.guild.id;
            const guildData = await getGuildData(guildId);

            if (guildData.SpamProtection === true) {
                const messagesArray = await getMessagesData(guildId);

                const newMessage = {
                    content: message.content,
                    timestamp: message.createdAt.getTime(),
                    authorId: message.author.id
                };

                messagesArray.push(newMessage);

                if (messagesArray.length > 20) {
                    messagesArray.shift();
                }

                await setMessagesData(guildId, messagesArray);
            }
        } catch (err) {
            console.error('Error in messageCreateEventHandler:', err);
        }
    },
};