const express = require('express');
const fs = require('node:fs');
const path = require('node:path');

// הפונקציה מקבלת את ה-client של הבוט כדי שנוכל להשתמש בו בתוך השרת
function startWebServer(client) {
    const app = express();
    const PORT = process.env.PORT || 8084;

    // 1. הגשת קבצי האתר הסטטיים מתוך תיקיית website
    app.use(express.static(path.join(__dirname, 'website')));

    app.get('/api/auth/discord/redirect', async (req, res) => {
        const code = req.query.code;
        
        if (!code) {
            return res.status(400).send('No code provided');
        }

        try {
            // 1. המרת ה-Code ל-Token מול דיסקורד
           const params = new URLSearchParams({
                client_id: process.env.BOT_ID,
                client_secret: process.env.CLIENT_SECRET, // כאן נכנס ה-Secret מהפורטל
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: 'https://tgc-bot.abecassis.vip/api/auth/discord/redirect' // חייב להיות זהה!
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
            // console.log('--- DEBUG OAUTH2 001 ---');
            const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
                headers: { authorization: `${tokenData.token_type} ${tokenData.access_token}` }
            });
            // console.log('--- DEBUG OAUTH2 002 ---');
            const userGuilds = await guildsResponse.json();
            // console.log('--- DEBUG OAUTH2 003 ---');
            // 3. סינון השרתים - בדיקה אם הוא אדמין/בעלים והבוט נמצא שם
            const ADMIN_PERMISSION_BIT = 0x8; // ביט הרשאת אדמיניסטרטור בדיסקורד
            // console.log('--- DEBUG OAUTH2 004 ---');
            const authorizedGuilds = userGuilds.filter(guild => {
                const isOwner = guild.owner;
                // בדיקת ביטים: האם הרשאת אדמין קיימת בתוך מחרוזת ההרשאות של השרת
                const isAdmin = (BigInt(guild.permissions) & BigInt(ADMIN_PERMISSION_BIT)) === BigInt(ADMIN_PERMISSION_BIT);
                // האם הבוט שלנו נמצא בשרת הזה כרגע?
                const isBotInServer = client.guilds.cache.has(guild.id);

                return (isOwner || isAdmin) && isBotInServer;
            });
            // console.log('--- DEBUG OAUTH2 005 ---');

            // 4. אם אין לו אף שרת שהוא אדמין בו והבוט נמצא שם - חסום גישה
            if (authorizedGuilds.length === 0) {
                return res.status(403).send('Access Denied: You do not manage any servers that utilize this bot.');
            }
            // console.log('--- DEBUG OAUTH2 006 ---');
            // 5. העברה למסך האדמין יחד עם ה-Token כדי שהדפדפן יוכל למשוך נתונים
            res.redirect(`/admin.html?token=${tokenData.access_token}`);
            // console.log('--- DEBUG OAUTH2 007 ---');


        } catch (error) {
            console.error('OAuth Error:', error);
            console.log('--- OAuth Error: ---', error );
            res.status(500).send('Server Error during authentication');
        }
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
    app.get('/api/data/guilds', (req, res) => {
        // בעתיד, תוסיף כאן בדיקה שהמשתמש מחובר ויש לו הרשאות מתאימות
        const dataPath = path.join(__dirname, 'data', 'data_guilds.json');
        res.sendFile(dataPath);
    });
    
    app.get('/api/dashboard-data', async (req, res) => {
        const token = req.query.token;
        if (!token) {
            return res.status(401).json({ error: 'Missing token' });
        }
        console.log('in /api/dashboard-data 001' );
        try {
            // 1. שליפת השרתים של המשתמש מדיסקורד (מבוצע מהשרת בצורה מאובטחת)
            const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
                headers: { authorization: `Bearer ${token}` }
            });
            console.log('in /api/dashboard-data 003' );

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

            // 3. טעינת הפקודות הקיימות בבוט מהתיקיות (מבוסס על הלוגיקה שלך)
            const commands = [];
            const foldersPath = path.join(__dirname, 'commands'); // ודא שהנתיב תואם למבנה הפרויקט שלך
            console.log('in /api/dashboard-data 003' );
            if (fs.existsSync(foldersPath)) {
                const commandFolders = fs.readdirSync(foldersPath);
                for (const folder of commandFolders) {
                    const commandsPath = path.join(foldersPath, folder);
                    if (fs.statSync(commandsPath).isDirectory()) {
                        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
                        for (const file of commandFiles) {
                            const command = require(path.join(commandsPath, file));
                            if ('data' in command) {
                                commands.push(command.data.toJSON());
                            }
                        }
                    }
                }
            }
            console.log('in /api/dashboard-data 004' );

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
            console.log('error /api/dashboard-data 004' , error);
            console.error('[API ERROR] Dashboard failed:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // הפעלת השרת
    app.listen(PORT, () => {
        console.log(`[SERVER] Web interface is running on port ${PORT}`);
    });
    
}

module.exports = startWebServer;