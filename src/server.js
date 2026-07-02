const express = require('express');
const fs = require('node:fs');
const path = require('node:path');
const { getGuildData, setGuildData } = require('./events/activityUtils');
// הפונקציה מקבלת את ה-client של הבוט כדי שנוכל להשתמש בו בתוך השרת
function startWebServer(client) {
    const app = express();
    const PORT = process.env.PORT || 8084;

    // --- הוספת תמיכה בפענוח JSON מתוך בקשות POST ---
    app.use(express.json());

    // 1. הגשת קבצי האתר הסטטיים מתוך תיקיית website
    app.use(express.static(path.join(__dirname, 'website')));

    app.use((req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*"); // או הכתובת הספציפית שלך
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
        next();
    });
    app.get('/api/auth/discord/redirect', async (req, res) => {
        const code = req.query.code;
        if (!code) {
            return res.status(400).send('No code provided');
        }

        try {
            // 1. המרת ה-Code ל-Token מול דיסקורד
            const REDIRECT_URI = process.env.REDIRECT_URI ;

            const params = new URLSearchParams({
                client_id: process.env.BOT_ID,
                client_secret: process.env.CLIENT_SECRET, 
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: REDIRECT_URI // השתמשנו במשתנה במקום בטקסט הקשיח
            });

            console.log('--- DEBUG OAUTH2 ---');
            // console.log('params :', params.toString());
            // console.log('--------------------');
            const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
                method: 'POST',
                body: params,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            const tokenData = await tokenResponse.json();

            if (!tokenResponse.ok) {
                console.error('Failed to get token:', tokenData);
                return res.status(400).send('Failed to authenticate with Discord.');
            }
            // 2. שליפת השרתים של המשתמש מדיסקורד
            const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
                headers: { authorization: `${tokenData.token_type} ${tokenData.access_token}` }
            });
            const userGuilds = await guildsResponse.json();
            // 3. סינון השרתים - בדיקה אם הוא אדמין/בעלים והבוט נמצא שם
            const ADMIN_PERMISSION_BIT = 0x8; // ביט הרשאת אדמיניסטרטור בדיסקורד
            const authorizedGuilds = userGuilds.filter(guild => {
                const isOwner = guild.owner;
                // בדיקת ביטים: האם הרשאת אדמין קיימת בתוך מחרוזת ההרשאות של השרת
                const isAdmin = (BigInt(guild.permissions) & BigInt(ADMIN_PERMISSION_BIT)) === BigInt(ADMIN_PERMISSION_BIT);
                // האם הבוט שלנו נמצא בשרת הזה כרגע?
                const isBotInServer = client.guilds.cache.has(guild.id);

                return (isOwner || isAdmin) && isBotInServer;
            });

            // 4. אם אין לו אף שרת שהוא אדמין בו והבוט נמצא שם - חסום גישה
            if (authorizedGuilds.length === 0) {
                return res.status(403).send('Access Denied: You do not manage any servers that utilize this bot.');
            }
            // 5. העברה למסך האדמין יחד עם ה-Token כדי שהדפדפן יוכל למשוך נתונים
            res.redirect(`/admin.html?token=${tokenData.access_token}`);

        } catch (error) {
            console.error('OAuth Error:', error);
            console.log('--- OAuth Error: ---', error );
            res.status(500).send('Server Error during authentication');
        }
    });
    app.use((req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*"); // או הכתובת הספציפית שלך
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
        next();
    });
    app.get('/api/user/guilds', async (req, res) => {
        const token = req.headers.authorization;
        if (!token) return res.status(401).json({ error: 'Unauthorized' });

        try {
            const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
                headers: { authorization: token }
            });
            const userGuilds = await guildsResponse.json();

            const ADMIN_PERMISSION_BIT = 0x8;
            const authorizedGuilds = userGuilds.filter(guild => {
                const isOwner = guild.owner;
                const isAdmin = (BigInt(guild.permissions) & BigInt(ADMIN_PERMISSION_BIT)) === BigInt(ADMIN_PERMISSION_BIT);
                const isBotInServer = client.guilds.cache.has(guild.id);
                return (isOwner || isAdmin) && isBotInServer;
            }).map(guild => ({
                id: guild.id,
                name: guild.name,
                icon: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null
            }));

            res.json(authorizedGuilds);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch guilds' });
        }
    });

    // 3. דוגמה לנתיב API שמשתמש במידע שמגיע מהבוט עצמו
    app.use((req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*"); // או הכתובת הספציפית שלך
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
        next();
    });
    app.get('/api/bot-status', (req, res) => {
        if (!client.isReady()) {
            return res.status(503).json({ status: 'Bot is offline' });
        }
        
        // שליפת נתונים חיים מהבוט (לדוגמה, בכמה שרתים הוא נמצא)
        res.json({
            status: 'Online',
            guildsCount: client.guilds.cache.size,
            ping: client.ws.ping
        });
    });

    // 4. הגשת נתוני ה-Data של הפרויקט
    app.use((req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*"); // או הכתובת הספציפית שלך
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
        next();
    });
    app.get('/api/data/guilds', (req, res) => {
        // בעתיד, תוסיף כאן בדיקה שהמשתמש מחובר ויש לו הרשאות מתאימות
        const dataPath = path.join(__dirname, 'data', 'data_guilds.json');
        res.sendFile(dataPath);
    });
    app.use((req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*"); // או הכתובת הספציפית שלך
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
        next();
    });
    app.get('/api/dashboard-data', async (req, res) => {
        const token = req.query.token;
        if (!token) {
            return res.status(401).json({ error: 'Missing token' });
        }

        try {
            // 1. שליפת השרתים של המשתמש מדיסקורד (מבוצע מהשרת בצורה מאובטחת)
            const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
                headers: { authorization: `Bearer ${token}` }
            });

            if (!guildsResponse.ok) {
                return res.status(401).json({ error: 'Invalid token or Discord session expired' });
            }

            const userGuilds = await guildsResponse.json();
            const ADMIN_PERMISSION_BIT = 0x8;

            // 2. סינון השרתים שבהם המשתמש אדמין/בעלים והבוט נמצא
            const authorizedGuilds = userGuilds.filter(guild => {
                const isOwner = guild.owner;
                const isAdmin = (BigInt(guild.permissions) & BigInt(ADMIN_PERMISSION_BIT)) === BigInt(ADMIN_PERMISSION_BIT);
                const isBotInServer = client.guilds.cache.has(guild.id);

                return (isOwner || isAdmin) && isBotInServer;
            });

            // 3. משיכת הפקודות ישירות מהזיכרון של הבוט! ללא קריאה מיותרת ומסוכנת מהדיסק
            const commands = [];
            if (client && client.commands) {
                client.commands.forEach(cmd => {
                    if (cmd.data) {
                        // מוודא שהמידע נמשך כראוי בין אם זה SlashCommandBuilder או אובייקט רגיל
                        commands.push(typeof cmd.data.toJSON === 'function' ? cmd.data.toJSON() : cmd.data);
                    }
                });
            }

            // 4. החזרת כל המידע המרוכז ל-Frontend קל ונקי
            res.json({
                guilds: authorizedGuilds.map(g => ({
                    id: g.id,
                    name: g.name,
                    icon: g.icon
                })),
                commands: commands
            });

        } catch (error) {
            console.error('[API ERROR] Dashboard failed:', error);
            console.log('ERROR api/dashboard-data error: ', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // 1. שליפת כל הערוצים של שרת מסוים
    app.get('/api/guilds/:guildId/channels', async (req, res) => {
        const guildId = req.params.guildId;
        // אימות טוקן יכול להיכנס כאן בעתיד

        try {
            // משיכת השרת מהזיכרון של הבוט (client)
            const guild = client.guilds.cache.get(guildId);
            if (!guild) {
                return res.status(404).json({ error: 'Guild not found or bot is not in this guild' });
            }

            // מיפוי הערוצים והחזרת השם, ה-ID והסוג
            const channels = guild.channels.cache.map(c => ({
                id: c.id,
                name: c.name,
                type: c.type
            }));

            res.json(channels);
        } catch (error) {
            console.error('[API] Error fetching channels:', error);
            res.status(500).json({ error: 'Failed to fetch channels' });
        }
    });

    // 2. שליפת ההגדרות הנוכחיות של השרת ממסד הנתונים
    app.get('/api/guilds/:guildId/settings', async (req, res) => {
        const guildId = req.params.guildId;

        try {
            // שימוש בפונקציה שלך למשיכת נתונים
            const guildData = await getGuildData(guildId);
            res.json(guildData || {});
        } catch (error) {
            console.error('[API] Error fetching guild data:', error);
            res.status(500).json({ error: 'Failed to fetch settings' });
        }
    });

    // 3. עדכון ושמירת הגדרות חדשות בשרת
    app.post('/api/guilds/:guildId/settings', async (req, res) => {
        const guildId = req.params.guildId;
        const newSettings = req.body; // המידע שנשלח מה-Frontend דרך POST

        try {
            // משיכת המידע הקיים
            let guildData = await getGuildData(guildId) || {};
            
            // מיזוג המידע הקיים עם המידע החדש שהגיע מהמשתמש
            guildData = { ...guildData, ...newSettings };

            // אם בחרו לא לשמור ערוץ לוג, נמחק אותו מהאובייקט למניעת זבל ב-DB
            if (newSettings.SpamProtectionLogChannel === null || newSettings.SpamProtectionLogChannel === '') {
                delete guildData.SpamProtectionLogChannel;
            }

            // שמירה חזרה למסד הנתונים
            await setGuildData(guildId, guildData);

            res.json({ success: true, message: 'Settings updated successfully', data: guildData });
        } catch (error) {
            console.error('[API] Error saving guild data:', error);
            res.status(500).json({ error: 'Failed to save settings' });
        }
    });

    // א. שליפת רשימת החברים בשרת (עבור פקודת ה-Kick)
    app.get('/api/guilds/:guildId/members', async (req, res) => {
        const guildId = req.params.guildId;
        try {
            const guild = client.guilds.cache.get(guildId);
            if (!guild) return res.status(404).json({ error: 'Guild not found' });
            
            // שולף את כל החברים (לפעמים דיסקורד לא שומר את כולם בזיכרון המיידי)
            const members = await guild.members.fetch();
            
            // מסנן את הבוטים ומחזיר רק משתמשים אמיתיים
            const memberList = members.filter(m => !m.user.bot).map(m => ({
                id: m.user.id,
                username: m.user.username,
                displayName: m.displayName
            }));
            
            res.json(memberList);
        } catch (error) {
            console.error('[API] Error fetching members:', error);
            res.status(500).json({ error: 'Failed to fetch members' });
        }
    });

    // ב. פעולת זריקת משתמש (Kick)
    app.post('/api/guilds/:guildId/actions/kick', async (req, res) => {
        const guildId = req.params.guildId;
        const { userId } = req.body;
        
        try {
            const guild = client.guilds.cache.get(guildId);
            if (!guild) return res.status(404).json({ error: 'Guild not found' });
            
            const memberToKick = await guild.members.fetch(userId);
            const botMember = await guild.members.fetch(client.user.id);

            // כאן נכנסת הבדיקה שביקשת
            if (memberToKick.roles.highest.position >= botMember.roles.highest.position) {
                return res.status(403).json({ error: 'Cannot kick user: User has a higher or equal role than the bot.' });
            }

            // אם עברנו את הבדיקה, מבצעים את הזריקה
            await memberToKick.kick('Kicked via Admin Dashboard');
            res.json({ success: true, message: 'Member kicked successfully' });
        } catch (error) {
            console.error('[API] Error kicking member:', error);
            res.status(500).json({ error: 'Failed to kick member. Check bot permissions.' });
        }
    });

    // ג. פעולת יצירת חדר (Gen-Room)
    app.post('/api/guilds/:guildId/actions/gen-room', async (req, res) => {
        const guildId = req.params.guildId;
        const { roomName } = req.body;
        
        try {
            const guild = client.guilds.cache.get(guildId);
            if (!guild) return res.status(404).json({ error: 'Guild not found' });

            // יצירת חדר קולי (סוג 2 מייצג GuildVoice)
            const genNewChannel = await guild.channels.create({
                name: roomName || 'Generator Room',
                type: 2 // ChannelType.GuildVoice
            });

            // עדכון מסד הנתונים עם ה-ID של החדר החדש כפי שמופיע בלוגיקה המקורית
            let guildData = await getGuildData(guildId) || {};
            if (!guildData.rootChannelId) guildData.rootChannelId = [];
            
            // השורות שתוקנו (בלי סוגריים מרובעים בסוף):
            guildData.rootChannelId.push(genNewChannel.id);
            await setGuildData(guildId, guildData);

            res.json({ success: true, channelId: genNewChannel.id });
        } catch (error) {
            console.error('[API] Error creating room:', error);
            res.status(500).json({ error: 'Failed to create room' });
        }
    });
    // ד. שליפת חדרים קיימים של Gen-Room
    app.get('/api/guilds/:guildId/gen-rooms', async (req, res) => {
        const guildId = req.params.guildId;
        try {
            const guild = client.guilds.cache.get(guildId);
            if (!guild) return res.status(404).json({ error: 'Guild not found' });

            const guildData = await getGuildData(guildId) || {};
            const rootChannelIds = guildData.rootChannelId || [];

            // נמיר את מספרי ה-ID לשמות החדרים כדי להציג אותם יפה
            const rooms = rootChannelIds.map(id => {
                const channel = guild.channels.cache.get(id);
                return {
                    id: id,
                    name: channel ? channel.name : 'Unknown Channel (Deleted?)',
                    exists: !!channel // בודק אם החדר עדיין באמת קיים בדיסקורד
                };
            });

            res.json(rooms);
        } catch (error) {
            console.error('[API] Error fetching gen-rooms:', error);
            res.status(500).json({ error: 'Failed to fetch rooms' });
        }
    });

    // ה. מחיקת חדר Gen-Room (גם מדיסקורד וגם מה-JSON)
    app.delete('/api/guilds/:guildId/actions/gen-room/:channelId', async (req, res) => {
        const { guildId, channelId } = req.params;
        
        try {
            const guild = client.guilds.cache.get(guildId);
            if (!guild) return res.status(404).json({ error: 'Guild not found' });

            // 1. נמחק את החדר מדיסקורד אם הוא עדיין קיים
            const channel = guild.channels.cache.get(channelId);
            if (channel) {
                await channel.delete('Deleted via Admin Dashboard');
            }

            // 2. נמחק את החדר מהמערך במסד הנתונים
            let guildData = await getGuildData(guildId) || {};
            if (guildData.rootChannelId) {
                guildData.rootChannelId = guildData.rootChannelId.filter(id => id !== channelId);
                await setGuildData(guildId, guildData);
            }

            res.json({ success: true, message: 'Room deleted' });
        } catch (error) {
            console.error('[API] Error deleting room:', error);
            res.status(500).json({ error: 'Failed to delete room' });
        }
    });

    // הפעלת השרת
    app.listen(PORT, () => {
        console.log(`[SERVER] Web interface is running on port ${PORT}`);
    });
    
}

module.exports = startWebServer;