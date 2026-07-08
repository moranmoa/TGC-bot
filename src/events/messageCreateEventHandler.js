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
                    messageId: message.id,
                    channelId: message.channel.id
                };

                messagesArray.push(newMessage);

                if (messagesArray.length > 20) {
                    messagesArray.shift();
                }

                await setMessagesData(guildId, messagesArray);

                // Check if the user has 'bot' or 'mod' role
                const hasAdminRole = message.member.roles.cache.some(role => role.name === 'bot' || role.name === 'mod');

                if (!hasAdminRole) {
                    // חלון הזמן לזיהוי ספאם (מוגדר במקום אחד)
                    const SPAM_WINDOW_MS = 5 * 60 * 1000; // 5 דקות
                    const windowStart = Date.now() - SPAM_WINDOW_MS;
                    // Count identical messages (same content and author) within the spam window
                    const identicalMessagesCount = messagesArray.filter(msg =>
                        msg.content === newMessage.content &&
                        msg.authorId === newMessage.authorId &&
                        msg.timestamp >= windowStart
                    ).length;

                    if (identicalMessagesCount > 3) {
                        console.log('*** Spam Protection make action ***');
                        console.log(`User: ${message.author.tag} (${message.author.id})`);
                        await message.member.timeout(120 * 60 * 1000, 'Do not spam!');

                        if (guildData.SpamProtectionLogChannel) {
                            const logChannel = client.channels.cache.get(guildData.SpamProtectionLogChannel);
                            if (logChannel) {
                                await logChannel.send(`*** Spam Protection action ***\nUser: ${message.author.tag} (${message.author.id})\nAction: Timeout for 2 hours due to spamming.`);
                            }
                        }

                        try {
                            await message.author.send('It looks like your account might have been compromised, please take care of it.');
                        } catch (err) {
                            console.error('Could not send DM to user:', err);
                        }

                        // Delete the spam messages from their respective channels
                        for (const msg of messagesArray) {
                            if (msg.content === newMessage.content &&
                                msg.authorId === newMessage.authorId &&
                                msg.timestamp >= windowStart) {
                                try {
                                    const channel = client.channels.cache.get(msg.channelId);
                                    if (channel) {
                                        const messageToDelete = await channel.messages.fetch(msg.messageId);
                                        if (messageToDelete) {
                                            await messageToDelete.delete();
                                        }
                                    }
                                } catch (err) {
                                    // We ignore errors here because the message might have been deleted already 
                                    // or the bot might lack permission to delete it in that specific channel.
                                }
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Error in messageCreateEventHandler:', err);
        }
    },
};