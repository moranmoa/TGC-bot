const express = require('express');
const fs = require('node:fs');
const path = require('node:path');

// הפונקציה מקבלת את ה-client של הבוט כדי שנוכל להשתמש בו בתוך השרת
function startWebServer(client) {
    const app = express();
    const PORT = process.env.PORT || 8084;

    // 1. הגשת קבצי האתר הסטטיים מתוך תיקיית website
    app.use(express.static(path.join(__dirname, 'website')));

    // 2. נתיב ה-Redirect של דיסקורד
    // app.get('/api/auth/discord/redirect', async (req, res) => {
    //     const code = req.query.code;
        
    //     if (!code) {
    //         return res.status(400).send('No code provided');
    //     }

    //     try {
    //         // 1. החלפת הקוד בטוקן
    //         const params = new URLSearchParams({
    //             client_id: process.env.BOT_ID,
    //             client_secret: process.env.CLIENT_SECRET,
    //             grant_type: 'authorization_code',
    //             code: code,
    //             redirect_uri: 'https://tgc-bot.abecassis.vip/api/auth/discord/redirect'
    //         });

    //         const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
    //             method: 'POST',
    //             body: params,
    //             headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    //         });

    //         const tokenData = await tokenResponse.json();
    //         if (!tokenResponse.ok) return res.status(400).send('Failed to authenticate');

    //         // 2. שליפת השרתים של המשתמש מדיסקורד
    //         const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
    //             headers: { authorization: `${tokenData.token_type} ${tokenData.access_token}` }
    //         });
    //         const userGuilds = await guildsResponse.json();

    //         // 3. סינון השרתים - בדיקה אם הוא אדמין/בעלים והבוט נמצא שם
    //         const ADMIN_PERMISSION_BIT = 0x8; // ביט הרשאת אדמיניסטרטור בדיסקורד

    //         const authorizedGuilds = userGuilds.filter(guild => {
    //             const isOwner = guild.owner;
    //             // בדיקת ביטים: האם הרשאת אדמין קיימת בתוך מחרוזת ההרשאות של השרת
    //             const isAdmin = (BigInt(guild.permissions) & BigInt(ADMIN_PERMISSION_BIT)) === BigInt(ADMIN_PERMISSION_BIT);
    //             // האם הבוט שלנו נמצא בשרת הזה כרגע?
    //             const isBotInServer = client.guilds.cache.has(guild.id);

    //             return (isOwner || isAdmin) && isBotInServer;
    //         });

    //         // 4. אם אין לו אף שרת שהוא אדמין בו והבוט נמצא שם - חסום גישה
    //         if (authorizedGuilds.length === 0) {
    //             return res.status(403).send('Access Denied: You do not manage any servers that utilize this bot.');
    //         }

    //         // 5. העברה למסך האדמין יחד עם ה-Token כדי שהדפדפן יוכל למשוך נתונים
    //         res.redirect(`/admin.html?token=${tokenData.access_token}`);

    //     } catch (error) {
    //         console.error('OAuth Error:', error);
    //         res.status(500).send('Server Error');
    //     }
    // });
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
            console.log('params :', params.toString());
            console.log('--------------------');
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
            console.log('--- DEBUG OAUTH2 001 ---');
            const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
                headers: { authorization: `${tokenData.token_type} ${tokenData.access_token}` }
            });
            console.log('--- DEBUG OAUTH2 002 ---');
            const userGuilds = await guildsResponse.json();
            console.log('--- DEBUG OAUTH2 003 ---');
            // 3. סינון השרתים - בדיקה אם הוא אדמין/בעלים והבוט נמצא שם
            const ADMIN_PERMISSION_BIT = 0x8; // ביט הרשאת אדמיניסטרטור בדיסקורד
            console.log('--- DEBUG OAUTH2 004 ---');
            const authorizedGuilds = userGuilds.filter(guild => {
                const isOwner = guild.owner;
                // בדיקת ביטים: האם הרשאת אדמין קיימת בתוך מחרוזת ההרשאות של השרת
                const isAdmin = (BigInt(guild.permissions) & BigInt(ADMIN_PERMISSION_BIT)) === BigInt(ADMIN_PERMISSION_BIT);
                // האם הבוט שלנו נמצא בשרת הזה כרגע?
                const isBotInServer = client.guilds.cache.has(guild.id);

                return (isOwner || isAdmin) && isBotInServer;
            });
            console.log('--- DEBUG OAUTH2 005 ---');

            // 4. אם אין לו אף שרת שהוא אדמין בו והבוט נמצא שם - חסום גישה
            if (authorizedGuilds.length === 0) {
                return res.status(403).send('Access Denied: You do not manage any servers that utilize this bot.');
            }
            console.log('--- DEBUG OAUTH2 006 ---');
            // 5. העברה למסך האדמין יחד עם ה-Token כדי שהדפדפן יוכל למשוך נתונים
            res.redirect(`/admin.html?token=${tokenData.access_token}`);
            console.log('--- DEBUG OAUTH2 007 ---');

            // // 2. שליפת פרטי המשתמש מדיסקורד בעזרת ה-Token
            // const userResponse = await fetch('https://discord.com/api/users/@me', {
            //     headers: {
            //         authorization: `${tokenData.token_type} ${tokenData.access_token}`
            //     }
            // });

            // const userData = await userResponse.json();

            // // 3. בדיקת הרשאות - ודא שה-ID תואם ל-ID שלך או לרשימת אדמינים
            // const ADMIN_ID = 'הכנס_את_הדיסקורד_ID_שלך_כאן'; 

            // if (userData.id === ADMIN_ID) {
            //     // המשתמש אומת כאדמין בהצלחה!
            //     // הערה: במערכת אמיתית נרצה לשמור עכשיו עוגייה (Cookie) או Session 
            //     // כדי שהוא לא יצטרך להתחבר כל פעם מחדש.
                
            //     res.redirect('/admin.html');
            // } else {
            //     // משתמש רגיל שניסה להתחבר
            //     res.status(403).send(`Access Denied: User ${userData.username} is not an admin.`);
            // }
            

        } catch (error) {
            console.error('OAuth Error:', error);
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
    // 5. נתיב API לשליפת רשימת הפקודות עבור פאנל הניהול
    app.get('/api/commands', (req, res) => {
        try {
            const commands = [];
            // התיקון: server.js ותיקיית commands נמצאים שניהם בתוך src
            // לכן אנחנו ניגשים ישירות אליה ללא צורך לחזור אחורה
            const foldersPath = path.join(__dirname, 'commands'); 
            
            if (fs.existsSync(foldersPath)) {
                const commandFolders = fs.readdirSync(foldersPath);

                // הלולאה הזו תעבור על תיקיות כמו 'admin' ו-'common'
                for (const folder of commandFolders) {
                    const commandsPath = path.join(foldersPath, folder);
                    
                    // מוודאים שזו אכן תיקייה לפני שמנסים לקרוא את הקבצים בתוכה
                    if (fs.statSync(commandsPath).isDirectory()) {
                        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
                        
                        for (const file of commandFiles) {
                            const command = require(path.join(commandsPath, file));
                            // מחפשים את המאפיין data שקיים ב-SlashCommandBuilder
                            if ('data' in command) {
                                commands.push(command.data.toJSON());
                            }
                        }
                    }
                }
            } else {
                console.warn(`[API] Commands folder not found at: ${foldersPath}`);
            }
            
            res.json(commands);
        } catch (error) {
            console.error('[API ERROR] Failed to load commands:', error);
            res.status(500).json({ error: 'Failed to load commands' });
        }
    });

    // הפעלת השרת
    app.listen(PORT, () => {
        console.log(`[SERVER] Web interface is running on port ${PORT}`);
    });
    
}

module.exports = startWebServer;