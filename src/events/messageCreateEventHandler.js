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
                    authorId: message.author.id,
                    messageId: message.id
                };

                messagesArray.push(newMessage);

                if (messagesArray.length > 20) {
                    messagesArray.shift();
                }

                await setMessagesData(guildId, messagesArray);

                // Check if the user has 'bot' or 'mod' role
                const hasAdminRole = message.member.roles.cache.some(role => role.name === 'bot' || role.name === 'mod');

                if (!hasAdminRole) {
                    const tenMinutesAgo = Date.now() - (5 * 60 * 1000);
                    // Count identical messages (same content and author) in the last 10 minutes
                    const identicalMessagesCount = messagesArray.filter(msg => 
                        msg.content === newMessage.content && 
                        msg.authorId === newMessage.authorId &&
                        msg.timestamp >= tenMinutesAgo
                    ).length;

                    if (identicalMessagesCount > 3) {
                        console.log('*** Spam Protection make action ***');
                        console.log(`User: ${message.author.tag} (${message.author.id})`);
                        await message.member.timeout(10 * 60 * 1000, 'Do not spam!');
                        
                    }
                }
            }
        } catch (err) {
            console.error('Error in messageCreateEventHandler:', err);
        }
    },
};