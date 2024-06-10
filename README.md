# TGC-ChatBOT

## Setup

### Installation

- Clone the repo
- Cd into the TGC-bot folder
- Execute (Unix):

```js
npm install
npm install -g nodemon
nodemon
```

- Execute (windows):

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
nodemon
```

-\*Set Execution Policy will allow the current User you are logged in as to run nodemon

### dotenv file

add .env with
TOKEN = MT......
GUILD_ID = 23...
BOT_ID = 124...

## Utilities

## to start dev

npm run dev 

###

`deploy-commands.js - fetches all JavaScript files under /commands/utility and published them.`

`delete-commands.js - deletes a specific command from the bot! (You should also remove the file and the remove the '/' command from the Apps Integration bot Management Panel)`.
