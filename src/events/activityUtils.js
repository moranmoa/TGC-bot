const { Guild } = require('discord.js');
const path = require('path');
const fs = require('fs').promises;

const dataDirPath = process.env.APP_ENV === 'DEV' ? path.join(__dirname, '..', 'data') : '/app/data';

// ---------------------------------------------------------------------------
// שכבת גישה לנתונים בטוחה מפני מרוצי-תנאים (race conditions)
// ---------------------------------------------------------------------------

// מנעול גנרי per-key: משרשר פעולות אסינכרוניות שנוגעות באותו מפתח כך שהן לא ירוצו
// בחפיפה. משמש גם לסדר קריאה-שינוי-כתיבה per-guild וגם לסדר כתיבה per-file.
const locks = new Map();
function withLock(key, fn) {
    const prev = locks.get(key) || Promise.resolve();
    const run = prev.then(() => fn(), () => fn());
    // שומרים על השרשרת אבל בולעים דחיות כדי שכשל אחד לא ירעיל את המנעול
    locks.set(key, run.then(() => {}, () => {}));
    return run;
}

// מנעול per-guild למחזור קריאה-שינוי-כתיבה שלם (מפתח נפרד ממנעול הקובץ -> אין deadlock).
function withGuildLock(guildId, fn) {
    return withLock('guild:' + String(guildId), fn);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// כתיבה אטומית ומסודרת: כותבים לקובץ זמני ואז rename (אטומי במערכת הקבצים, כך שקוראים
// לעולם לא רואים קובץ חלקי). מסדר את כל הכתיבות לאותו קובץ במנעול per-path כדי למנוע
// rename מקבילים (שגורמים ל-EPERM בווינדוס), עם retry קטן לנעילות רגעיות (אנטי-וירוס וכו').
let tmpCounter = 0;
async function atomicWriteFile(filePath, contents) {
    return withLock('file:' + filePath, async () => {
        const tmpPath = `${filePath}.${process.pid}.${tmpCounter++}.tmp`;
        await fs.writeFile(tmpPath, contents);
        for (let attempt = 1; ; attempt++) {
            try {
                await fs.rename(tmpPath, filePath);
                return;
            } catch (err) {
                if ((err.code === 'EPERM' || err.code === 'EACCES') && attempt < 5) {
                    await sleep(20 * attempt);
                    continue;
                }
                await fs.unlink(tmpPath).catch(() => {});
                throw err;
            }
        }
    });
}

async function getGuildData(guildId) {
    try {
        const filePath = path.join(dataDirPath, `data_${guildId}.json`);
        const jsonString = await fs.readFile(filePath, 'utf8');
        const data = JSON.parse(jsonString);
        // console.log("* Guild Data * :",guildId,data)
        return data;
    } catch (err) {
        // קובץ שעדיין לא קיים = מצב תקין בקריאה ראשונה של שרת; לא מרעישים על זה.
        // רק שגיאות אמת (קובץ פגום / JSON לא תקין) ראויות ללוג.
        if (err.code !== 'ENOENT') {
            console.error('Error reading/parsing guild data file for guildId', guildId, err);
        }
        return {"aActiveChannels":[],"rootChannelId":[]};
    }
}
async function setGuildData(guildId, data) {
    const jsonData = JSON.stringify(data, null, 2);
    try {
        const filePath = path.join(dataDirPath, `data_${guildId}.json`);
        await atomicWriteFile(filePath, jsonData);
    } catch (err) {
        console.error('Error writing guild data file for guildId', guildId, err);
    }
}

// קריאה-שינוי-כתיבה אטומית תחת מנעול. ה-mutator מקבל את הנתונים הנוכחיים,
// משנה אותם (או מחזיר אובייקט חדש), והתוצאה נכתבת בבטחה. זו הדרך המומלצת
// לעדכן נתוני שרת מתוך handlers שרצים במקביל.
async function updateGuildData(guildId, mutator) {
    return withGuildLock(guildId, async () => {
        const data = await getGuildData(guildId);
        const result = await mutator(data);
        const toWrite = result === undefined ? data : result;
        try {
            const filePath = path.join(dataDirPath, `data_${guildId}.json`);
            await atomicWriteFile(filePath, JSON.stringify(toWrite, null, 2));
        } catch (err) {
            console.error('Error writing guild data file for guildId', guildId, err);
        }
        return toWrite;
    });
}

async function getMessagesData(guildId) {
    try {
        const filePath = path.join(dataDirPath, `data_${guildId}_messages.json`);
        const jsonString = await fs.readFile(filePath, 'utf8');
        return JSON.parse(jsonString);
    } catch (err) {
        return [];
    }
}

async function setMessagesData(guildId, data) {
    const jsonData = JSON.stringify(data, null, 2);
    try {
        const filePath = path.join(dataDirPath, `data_${guildId}_messages.json`);
        await atomicWriteFile(filePath, jsonData);
    } catch (err) {
        console.error('Error writing messages data:', err);
    }
}

function getActivityName(User) {
    let activityName;
    let customStatusName;
    try {
      let activities = User.presence.activities;
      if (activities && activities.length) {
        activities.forEach((activity) => {
          console.log("**** activity ",activity.name," ",activity.state," ",activity.type)
          switch (activity.type) {
            case 0: //'Game'
              activityName = {"name": '\u{1F3AE}' +activity.name,
                "type":activity.type
              };
              break;
            case 4: //status
              customStatusName = {"name": '\u{1F4AC}'+ activity.state,//U+1F4AC
                "type":activity.type
              };
              break;
            case 6: //'Hang Status'
              break;
          }
        });
      }
    } catch (e) {}
    activityName = activityName ? activityName : customStatusName; //if name or status
    activityName = activityName ? activityName : {"name": '\u{1F464}'+User.user.globalName,"type":6}; //else username
  
    return activityName;
  }

  function whatName(currentActivityName,newActivityName){
    if(currentActivityName.name == newActivityName.name){
        return false
    }
    if(newActivityName.type==0 || currentActivityName.type!=0){
        return true
    }else{
        return false
    }
  }

  module.exports = {getActivityName ,whatName, getGuildData ,setGuildData, updateGuildData, withGuildLock, getMessagesData, setMessagesData};
