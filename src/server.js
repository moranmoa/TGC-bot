const express = require('express');
const path = require('node:path');

// הפונקציה מקבלת את ה-client של הבוט כדי שנוכל להשתמש בו בתוך השרת
function startWebServer(client) {
    const app = express();
    const PORT = process.env.PORT || 8084;

    // 1. הגשת קבצי האתר הסטטיים מתוך תיקיית website
    app.use(express.static(path.join(__dirname, 'website')));

    // 2. נתיב ה-Redirect של דיסקורד
    app.get('/api/auth/discord/redirect', async (req, res) => {
        const code = req.query.code;
        
        if (!code) {
            return res.status(400).send('No code provided');
        }

        try {
            // כאן תטפל בהמרת ה-code לטוקן מול ה-API של דיסקורד
            // ...
            res.send('Authentication pending...');
        } catch (error) {
            console.error('OAuth Error:', error);
            res.status(500).send('Server Error');
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

    // הפעלת השרת
    app.listen(PORT, () => {
        console.log(`[SERVER] Web interface is running on port ${PORT}`);
    });
}

module.exports = startWebServer;