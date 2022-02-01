const fetchPromise = import('node-fetch').then((mod) => mod.default);
const fetch = (...args) => fetchPromise.then((fetch) => fetch(...args));
const util = require('./util');

class SteamManager {
  constructor(server) {
    this.server = server;

    util.setIntervalAsync(this.UpdateAllPlayerState, 10000);
  }

  async GetSteamUsername(steamID) {
    const steamAPIURL = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${this.server.steamAPIKey}&steamids=${steamID}`;
    let personaName;
    let errorText = '';
    personaName = fetch(steamAPIURL).then((response) => response.json()).then((data) => {
      let fetchingError = false;
      if (personaName = data.response.players.length !== 0) {
        personaName = data.response.players[0].personaname;
      } else {
        errorText = 'Cannot get steam username from steam ID';
        fetchingError = true;
      }
      if (fetchingError) { return ('', true, 'Cannot get steam username from ID'); }
      return ([personaName, fetchingError, errorText]);
    });
    return (await personaName);
  }

  async GetSingleUserLoginState(personaName, steamID, group) {
    // Checks one user to see if they are currently logged in or not.
    // This is used when a new user is added to a group.
    // Will run FetchBattlemetricData() and check to see if the supplied username has a current session
    // If it does then it will return currentSession 'time'
    // If the user is not current logged into the server it will set the last seen to 'never' and current session to blank

    const [sessionData, fetchingError, errorText] = await this.FetchBattlemetricData();
    // const test = await this.FetchBattlemetricData();
    let loginState; let lastSeen; let currentSession;

    if (fetchingError) { return ([null, null, null, true, errorText]); } // If there was an error fetching BM data then report back to discordManager.

    let isPlayerPresent = false;
    sessionData.forEach((player) => { // For each player currently logged in
      if (player.Name === personaName) { // Player is on battlemetrics
        isPlayerPresent = true;
        loginState = 'ONLINE';
        lastSeen = `${new Date()}`;
        currentSession = player.SessionStarted;
      }
    });

    if (!isPlayerPresent) { // Player is not on battlemetrics
      const oldPlayerData = this.server.databaseManager.GetPlayersDataByID(steamID, group);
      lastSeen = (oldPlayerData === undefined) ? 'Never' : oldPlayerData.LastSeen;
      loginState = 'OFFLINE';
      lastSeen = `${lastSeen}`;
      currentSession = 0;
    }

    return ([loginState, lastSeen, currentSession, fetchingError, errorText]);
  }

  async FetchBattlemetricData() {
    // Responsible for reaching out to Battlemetrics and pulling the current play session start time for everyone.
    // This data will then be return in the format of:
    // [{"Name": "Nerif", "SessionStarted":"Mon Jan 31 2022 10:49:03 GMT+0000 (Greenwich Mean Time)"},...]
    // Error handling is done by fetchingError (true if failure) and errorText (Debug text for user).

    const battlemetricsURL = this.server.bmURL;
    let sessionData = [];
    let fetchingError = false;
    let errorText = '';

    sessionData = fetch(battlemetricsURL).then((response) => response.json()).then((data) => {
      const sessionData = [];
      if (data.hasOwnProperty('errors') || !data.hasOwnProperty('included')) {
        fetchingError = true;
        errorText = 'Cannot get battlemetrics data';
      } else {
        for (const [key, value] of Object.entries(data.included)) {
          sessionData.push({ Name: `${value.attributes.name}`, SessionStarted: `${new Date(value.attributes.start)}` });
        }
      }
      return ([sessionData, fetchingError, errorText]);
    });
    return (await sessionData);
  }

  UpdateAllPlayerState = async () => {
    const [sessionData, fetchingError, errorText] = await this.FetchBattlemetricData();
    // const test = await this.FetchBattlemetricData();
    let loginState; let lastSeen; let currentSession;

    if (fetchingError) { return ([null, null, null, true, errorText]); }

    this.server.databaseManager.SetUpdateTime();

    this.server.databaseManager.GetAllGroups().forEach(async (group) => { // For each group in the database
      group.PlayerList.forEach(async (DBplayer) => { // For each player in the database
        const steamName = await this.GetSteamUsername(DBplayer.PlayerID);

        let isPlayerPresent = false;
        sessionData.forEach((BMplayer) => { // For each player currently logged in
          if (BMplayer.Name === steamName[0]) { // Player is on battlemetrics
            isPlayerPresent = true;
            lastSeen = `${new Date()}`;
            loginState = 'ONLINE';
            currentSession = BMplayer.SessionStarted;
          }
        });

        if (!isPlayerPresent) { // Player is not on battlemetrics
          const oldPlayerData = this.server.databaseManager.GetPlayersDataByID(DBplayer.PlayerID, group.GroupID);
          lastSeen = (oldPlayerData === undefined) ? 'Never' : oldPlayerData.LastSeen;
          loginState = 'OFFLINE';
          lastSeen = `${lastSeen}`;
          currentSession = 0;
        }
        this.server.databaseManager.updatePlayerDetails(group.GroupID, DBplayer.PlayerID, steamName[0], lastSeen, loginState, currentSession);
        // Update each player in the database
      });
    });
  };
}

module.exports = SteamManager;
