const { JsonDB } = require('node-json-db');
const { Config } = require('node-json-db/dist/lib/JsonDBConfig');

class DatabaseManager {
  constructor(server) {
    this.db = new JsonDB(new Config('database', true, true, '/'));

    this.server = server;

    this.server.rustServerIP = this.db.getData('/DiscordServer/RustServerIP');
    this.server.rustServerPort = this.db.getData('/DiscordServer/RustServerPort');
    this.server.steamID = this.db.getData('/DiscordServer/SteamID');
    this.server.rustPlusToken = this.db.getData('/DiscordServer/RustPlusToken');
    this.server.discordToken = this.db.getData('/DiscordServer/DiscordToken');
    this.server.steamAPIKey = this.db.getData('/DiscordServer/SteamAPIKey');
    this.server.bmURL = this.db.getData('/DiscordServer/BMURL');;
    this.server.eventChannelID = this.db.getData('/DiscordServer/EventChannelID');
    this.server.playerTrackerChannelID = this.db.getData('/DiscordServer/PlayerTracker/ChannelID');
    this.server.pinsChannelID = this.db.getData('/DiscordServer/PinsChannelID/ChannelID');
  }

  GetPlayersDataByID(steamID, group) {
    const data = this.db.getData('/DiscordServer/PlayerTracker/Groups');
    let playerData;

    for (const [groupIndex, groups] of Object.entries(data)) { // Check all the groups to see if they exist.
      if (groups.GroupID !== group) { continue; }
      for (const [key2, players] of Object.entries(groups.PlayerList)) { // Check to see if the player is already added to the group.
        if (players.PlayerID === steamID) {
          playerData = players;
        }
      }
      return (playerData);
    }
  }

  SetUpdateTime() {
    this.db.push('/DiscordServer/PlayerTracker', {
      LastUpdate: `${new Date().toLocaleTimeString('en-GB')}`,
    }, false);
  }

  GetUpdateTime() {
    return this.db.getData('/DiscordServer/PlayerTracker/LastUpdate');
  }

  GetGroupByID(group) {
    const data = this.db.getData('/DiscordServer/PlayerTracker/Groups');

    for (const [groupIndex, groups] of Object.entries(data)) { // Check all the groups to see if they exist.
      if (groups.GroupID !== group) { continue; }
      return (groups);
    }
  }

  GetAllGroups() {
    const data = this.db.getData('/DiscordServer/PlayerTracker/Groups');
    return (data);
  }

  SetGroupID(group, id) {
    const data = this.db.getData('/DiscordServer/PlayerTracker/Groups');
    for (const [groupIndex, groups] of Object.entries(data)) { // Check all the groups to see if they exist.
      if (groups.GroupID !== group) { continue; }
      this.db.push(`/DiscordServer/PlayerTracker/Groups[${groupIndex}]`, {
        MessageID: `${id}`,
      }, false);
    }
  }

  updatePlayerDetails(group, playerID, playerName, LastSeen, LoginState, CurrentSession) {
    const data = this.db.getData('/DiscordServer/PlayerTracker/Groups');

    for (const [groupIndex, groups] of Object.entries(data)) { // Check all the groups to see if they exist.
      if (groups.GroupID !== group) { continue; }

      for (const [playerIndex, players] of Object.entries(groups.PlayerList)) { // Check to see if the player is already added to the group.
        if (players.PlayerID === playerID) {
          // FOUND PLAYER
          this.db.push(`/DiscordServer/PlayerTracker/Groups[${groupIndex}]/PlayerList[${playerIndex}]`, {
            PlayerName: `${playerName}`,
            LastSeen: `${LastSeen}`,
            LoginState: `${LoginState}`,
            CurrentSession: `${CurrentSession}`,
          }, false);
        }
      }
    }
  }

  addPlayerToGroup(group, playerID, playerName, LastSeen, LoginState, CurrentSession) {
    const data = this.db.getData('/DiscordServer/PlayerTracker/Groups');
    let isGroupAlreadyAdded = false;
    let errorMsg = '';
    let isPlayerAlreadyAdded = false;
    for (const [groupIndex, groups] of Object.entries(data)) { // Check all the groups to see if they exist.
      if (groups.GroupID !== group) { continue; }
      isGroupAlreadyAdded = true;

      for (const [key2, players] of Object.entries(groups.PlayerList)) { // Check to see if the player is already added to the group.
        if (players.PlayerID === playerID) {
          isPlayerAlreadyAdded = true;
          errorMsg = 'Player already added!'; // TODO: Return error!
        }
      }
      if (!isPlayerAlreadyAdded) {
        this.db.push(`/DiscordServer/PlayerTracker/Groups[${groupIndex}]/PlayerList[${groups.PlayerList.length}]`, {
          PlayerName: `${playerName}`,
          PlayerID: `${playerID}`,
          LastSeen: `${LastSeen}`,
          LoginState: `${LoginState}`,
          CurrentSession: `${CurrentSession}`,
        }, true);
      }
    }

    if (!isGroupAlreadyAdded) { // If group does not exist.
      const numberOfGroups = this.db.getData('/DiscordServer/PlayerTracker/Groups/').length;
      this.db.push(`/DiscordServer/PlayerTracker/Groups[${numberOfGroups}]`, {
        GroupID: `${group}`,
        MessageID: '',
        PlayerList: [{
          PlayerName: `${playerName}`, PlayerID: `${playerID}`, LastSeen: `${LastSeen}`, LoginState: `${LoginState}`, CurrentSession: `${CurrentSession}`,
        }],
      }, true);
    }
    return ([isPlayerAlreadyAdded, errorMsg]);
  }

  removePlayerFromGroup = (group, playerID) => {
    const data = this.db.getData('/DiscordServer/PlayerTracker/Groups');
    let isGroupAlreadyAdded = false;
    for (const [groupIndex, groups] of Object.entries(data)) { // Check all the groups to see if they exist.
      if (groups.GroupID !== group) { continue; }
      isGroupAlreadyAdded = true;
      let isPlayerAlreadyAdded = false;
      for (const [key2, players] of Object.entries(groups.PlayerList)) { // Check to see if the player is already added to the group.
        if (players.PlayerID === playerID) {
          isPlayerAlreadyAdded = true;
          this.db.delete(`/DiscordServer/PlayerTracker/Groups[${groupIndex}]/PlayerList[${key2}]`);

          if (groups.PlayerList.length === 0) { // If there is no one left in the group then delete it
            this.db.delete(`/DiscordServer/PlayerTracker/Groups[${groupIndex}]`);
          }
        }
      }
      if (!isPlayerAlreadyAdded) {
        // TODO: Add error that the user does not exist
      }
    }

    if (!isGroupAlreadyAdded) { // If group does not exist.
      // TODO: Add error that the group does not exist
    }
  };

  removeGroup = (group) => {
    const data = this.db.getData('/DiscordServer/PlayerTracker/Groups');
    let isGroupAlreadyAdded = false;
    for (const [groupIndex, groups] of Object.entries(data)) { // Check all the groups to see if they exist.
      if (groups.GroupID !== group) { continue; }
      isGroupAlreadyAdded = true;
      this.db.delete(`/DiscordServer/PlayerTracker/Groups[${groupIndex}]`);
    }

    if (!isGroupAlreadyAdded) { // If group does not exist.
      // TODO: Add error that the group does not exist and thus could not be deleted
    }
  };
}

module.exports = DatabaseManager;
