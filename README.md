# TGC-ChatBOT

## Installation

- Clone the repo
- Cd into the TGC-bot folder
- get node js v21.xx

### Unix
```js
npm install
npm install -g nodemon
```
### Windows
step 1.

```js
npm install
npm install -g nodemon
npm config get prefix -> Add npm PATH to your global env PATH
```

step 2.

```js
Open PowerShell with Admin permissions,
Execute: -Set-ExecutionPolicy RemoteSigned -Scope CurrentUser*
```

-\*Set Execution Policy will allow the current User you are logged in as to run nodemon

### Dotenv Example

```
TOKEN = MT......
GUILD_ID = 23...
BOT_ID = 124...
```

## Utilities

### to start dev

`npm run dev`

### Deployments & Deletion of Commands

```js
src / tools / deploy - commands.js; //fetches all JavaScript files under /commands/utility and published them. (node .\src\tools\deploy-commands.js)

src / tools / delete -commands.js; //deletes a specific command from the bot! (You should also remove the file and the remove the '/' command from the Apps Integration bot Management Panel)`
```

### Logger

Utilize log4js, configuration and layouts sits on logger.js file.

Import logger.js to your JS file, add these lines:

```js
const log4js = require("log4js"); //log4js library

const {} = require("../logger"); - //path to main logger.js (reside in the src folder)

const appLogger = log4js.getLogger("client"); //(logger category) (one of: app | channel | client)

appLogger.log("New Channel Created", {iD: channel.id,name: channel.name}); // usage example writes to the logger that a new channel was created with the channel ID and the channel name.
```
