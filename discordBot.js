const { Client, Intents, UserContextMenuInteraction } = require('discord.js');
const util = require('./util');

class DiscordBot {
  constructor(server) {
    this.ready = false;
    this.client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
    this.server = server;
    this.steamManager = this.server.steamManager;

    this.client.on('ready', () => {
      this.ready = true;
      util.setIntervalAsync(this.updateAllGroupMsg, 9000);
    });

    this.client.on('messageCreate', (msg) => {
      if (msg.content.includes('!rh')) {
        const secondSpace = msg.content.indexOf(' ', 4);
        const group = (msg.content.substring(4, msg.content.indexOf(' ', 5))).toLowerCase();
        const command = (msg.content.substring(secondSpace + 1, msg.content.indexOf(' ', secondSpace + 1))).toLowerCase();
        const arg = msg.content.substring(msg.content.indexOf(' ', msg.content.indexOf(command)) + 1, msg.content.length);

        this.client.channels.cache.get(`${this.server.playerTrackerChannelID}`).messages.fetch(msg.id).then((msg) => msg.delete(100));

        if (command === 'add') {
          this.addUser(arg, group);
        }

        if (command === 'remove') {
          if (arg === 'all') {
            const groupData = this.server.databaseManager.GetGroupByID(group);
            this.client.channels.cache.get(`${this.server.playerTrackerChannelID}`).messages.fetch(groupData.MessageID).then((msg) => msg.delete());
            this.server.databaseManager.removeGroup(group);
          } else {
            const groupData = this.server.databaseManager.GetGroupByID(group);
            this.server.databaseManager.removePlayerFromGroup(group, arg);
            if (this.server.databaseManager.GetGroupByID(group) !== undefined) {
              this.generateMsgForGroup(group, groupData.MessageID);
            } else {
              this.client.channels.cache.get(`${this.server.playerTrackerChannelID}`).messages.fetch(groupData.MessageID).then((msg) => msg.delete());
            }
          }
        }
      }
    });
  }

  updateAllGroupMsg = async () => {
    this.server.databaseManager.GetAllGroups().forEach((group) => {
      this.generateMsgForGroup(group.GroupID, group.MessageID);
    });
  };

  async addUser(arg, group) {
    const username = await this.steamManager.GetSteamUsername(arg);
    if (username[1]) { console.log(username[2]); return; } // If there was an error getting the username
    const userState = await this.steamManager.GetSingleUserLoginState(username[0], arg, group);
    if (userState[3]) { console.log(userState[4]); return; }
    const err = this.server.databaseManager.addPlayerToGroup(group, arg, username[0], userState[1], userState[0], userState[2]);

    if (err[0]) { console.log(err[1]); return; }

    // GroupName, SteamID, PlayerName,  LastSeen,     LoginState,   CurrentSession
    // group,     arg,     username[0], userState[1], userState[0], userState[2]

    const playerInfoMsg = this.generatePlayerInfoMsg(group, arg, username[0], userState[1], userState[0], userState[2]);
    const groupData = this.server.databaseManager.GetGroupByID(group);

    if (groupData.MessageID === '') { // No messageID stored for this group so send a new message and set the messageID
      groupData.MessageID = (await this.client.channels.cache.get(`${this.server.playerTrackerChannelID}`).send('Processing...')).id;
      this.server.databaseManager.SetGroupID(group, groupData.MessageID);
    }
    this.generateMsgForGroup(group, groupData.MessageID);
  }

  async generateMsgForGroup(GroupName, msgID) {
    let finalMsg = `\`\`\`Group ${GroupName.toUpperCase()} | last updated: ${this.server.databaseManager.GetUpdateTime()}`;
    // Loop through every member of a group and generate a line for them using generatePlayerInfoMsg(). Append that line to finalMsg
    const groupData = this.server.databaseManager.GetGroupByID(GroupName);

    groupData.PlayerList.forEach((player) => {
      const playerData = this.server.databaseManager.GetPlayersDataByID(player.PlayerID, GroupName);

      finalMsg += `\n${this.generatePlayerInfoMsg(GroupName, player.PlayerID, playerData.PlayerName, playerData.LastSeen, playerData.LoginState, playerData.CurrentSession)}`;
    });
    finalMsg += '\`\`\`';
    await this.client.channels.cache.get(`${this.server.playerTrackerChannelID}`).messages.fetch(msgID).then((msg) => msg.edit(finalMsg));
  }

  generatePlayerInfoMsg(GroupName, SteamID, PlayerName, LastSeen, LoginState, CurrentSession) {
    let userStateMsg = '';
    if (LoginState === 'OFFLINE') {
      if (LastSeen === 'Never') {
        userStateMsg = 'Last seen: Never';
      } else {
        const lastSeen = new Date(LastSeen);
        userStateMsg = `Last seen: ${('0' + lastSeen.getHours()).slice(-2)}:${('0' + lastSeen.getMinutes()).slice(-2)} ${lastSeen.getMonth()}/${lastSeen.getDay()}/${lastSeen.getFullYear()}`;
      }
    } else if (LoginState === 'ONLINE') {
      const hours = Math.trunc(Math.abs(new Date() - new Date(CurrentSession)) / 36e5);
      const mins = Math.floor(((new Date() - new Date(CurrentSession)) / 36e5) % 1 * 60);
      userStateMsg = `Current Session: ${hours} hours ${mins} minutes`;
    }

    const spaceAmount = (' ').repeat(Math.abs(25 - PlayerName.length));

    return `${PlayerName}:${spaceAmount}[${LoginState}]\t${userStateMsg} (${SteamID})`;
  }

  startDiscordBot = () => {
    this.client.login(this.server.discordToken);
  };

  sendEventMessage(message) {
    const waitForDiscordConnection = new Promise((resolve, reject) => {
      setInterval(() => {
        if (this.ready) {
          resolve(true);
        }
      }, 300);
    });

    waitForDiscordConnection.then(() => {
      this.client.channels.cache.get(`${this.server.eventChannelID}`).send(message);
    });
  }
}

module.exports = DiscordBot;
