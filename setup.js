databaseTemplate = {
    "DiscordServer": {
        "RustServerIP":"",
        "RustServerPort":"",
        "SteamID":"",
        "RustPlusToken":"",
        "DiscordToken":"",
        "SteamAPIKey":"",
        "BMURL":"",  
        "EventChannelID": "",
        "PlayerTracker": {
            "ChannelID": "",
            "LastUpdate": "",
            "Groups": []
        },
        "PinsChannelID": {
            "ChannelID": "",
            "PinMessageID": ""
        }
    }
}

const prompt = require("prompt-sync")({ sigint: true });
const { JsonDB } = require('node-json-db');
const { Config } = require('node-json-db/dist/lib/JsonDBConfig');

this.db = new JsonDB(new Config('database', true, true, '/'));

databaseTemplate.DiscordServer.RustServerIP = prompt("Rust server's IP address: ");
databaseTemplate.DiscordServer.RustServerPort = prompt("Rust server's query port: ");
databaseTemplate.DiscordServer.SteamID = prompt("What is your steam ID: ");
databaseTemplate.DiscordServer.RustPlusToken = prompt("What is your Rust Plus Token (Can be found by downloading github.com/liamcottle/rustplus.js#using-the-command-line-tool and running 'npx @liamcottle/rustplus.js fcm-register' and then npx @liamcottle/rustplus.js fcm-listen): ");
databaseTemplate.DiscordServer.DiscordToken = prompt("What is your Discord bots token, can be created following www.freecodecamp.org/news/create-a-discord-bot-with-javascript-nodejs/: ");
databaseTemplate.DiscordServer.SteamAPIKey = prompt("What is your steam API key, found at steamcommunity.com/dev/apikey: ");
databaseTemplate.DiscordServer.BMURL = prompt("What is your servers Battlemetrics server ID. EG, just type in the end numbers the URL: https://www.battlemetrics.com/servers/rust/3344761: ");
databaseTemplate.DiscordServer.BMURL = `https://api.battlemetrics.com/servers/${databaseTemplate.DiscordServer.BMURL}?include=session`
console.log('Youll next need three channels in your discord server that your bot has admin permissions of. Take note of the channel IDS of each of them. You will need to enable developer settings in discord to enable the "Copy Channel ID" right click context menu: ')
databaseTemplate.DiscordServer.EventChannelID = prompt("What is your discord event channel ID: ");
databaseTemplate.DiscordServer.PlayerTracker.ChannelID = prompt("What is your discord player tracker channel ID: ");
databaseTemplate.DiscordServer.PinsChannelID.ChannelID = prompt("What is your discord pins channel ID: ");

this.db.push('/', databaseTemplate, false);

