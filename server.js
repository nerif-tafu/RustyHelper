const DiscordBot = require('./discordBot');
const RustBot = require('./rustBot');
const DatabaseManager = require('./databaseManager');
const SteamManager = require('./steamManager');

class Server {
  constructor() {
    this.databaseManager = new DatabaseManager(this);
    this.steamManager = new SteamManager(this);
    this.discordBot = new DiscordBot(this);
    this.rustBot = new RustBot(this);

    this.StartServer();
  }

  StartServer() {
    this.discordBot.startDiscordBot();
    this.rustBot.startRustBot();
  }

  DisplayMessage(displayDiscord, displayRust, message) {
    if (displayDiscord) {
      this.discordBot.sendEventMessage(message);
    }
    if (displayRust) {
      this.rustBot.sendTeamMessage(message);
    }
  }
}

const server = new Server();
