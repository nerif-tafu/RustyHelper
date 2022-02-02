const RustPlus = require('@liamcottle/rustplus.js');
const util = require('./util');

const MONUMENTRANGE = 50; // TODO: Change this back to 200 once you fix cargo setting off the chinook events

class RustBot {
  constructor(server) {
    this.ip = '51.91.104.104';
    this.port = '28082';
    this.steamid = '76561198056409776';
    this.token = '153962960';

    this.server = server;

    this.currentMapMarkers = {
      patrolHeli: [false, false, new Date()], patrolHeliCrate: [false, false, new Date()], bradleyCrate: [false, false, new Date()], smalloilrig: [false, false, new Date()], largeoilrig: [false, false, 0], chinook: [false, false, new Date()], cargo: [false, false, new Date()],
      // TODO: Change the properties to something like patrolHeli.hasSpawned and patrolHeli.lastSpawnTime.
    };

    this.monumentCoordinates = {};

    this.rustplus = new RustPlus(this.server.rustServerIP, this.server.rustServerPort, this.server.steamID, this.server.rustPlusToken);
  }

  startRustBot = () => {
    this.rustplus.connect();

    this.rustplus.on('connected', () => {
      this.getMonumentCoordinates();
      util.setIntervalAsync(this.checkMapMarkers, 5000); // Setup map marker checks every 5 seconds.
    });

    this.rustplus.on('message', (message) => {
      if (message.broadcast && message.broadcast.teamMessage && message.broadcast.teamMessage.message.message.includes('!day')) {
        this.rustplus.sendRequest({
          getTime: {},
        }, (message) => {
          if (message.response && message.response.time) {
            let res = 0;
            const duskdawn = 0.5;
            const daylength = message.response.time.sunset - message.response.time.sunrise - (duskdawn * 2);
            const nightlength = 24 - daylength;
            const len_day = ((message.response.time.dayLengthMinutes * message.response.time.timeScale) - nightlength) / daylength;
            const len_night = nightlength / (24 - daylength);

            if (message.response.time.time > message.response.time.sunrise && message.response.time.time < message.response.time.sunset) {
              if (message.response.time.time < message.response.time.sunrise + duskdawn) {
                res = (message.response.time.sunrise + duskdawn - message.response.time.time) * len_night;
                res += (message.response.time.sunset - duskdawn - (message.response.time.sunrise + duskdawn)) * len_day;
                res += duskdawn * len_night;
              } else if (message.response.time.time < message.response.time.sunset - duskdawn) {
                res = (message.response.time.sunset - duskdawn - message.response.time.time) * len_day;
                res += duskdawn * len_night;
              } else res = (message.response.time.sunset - message.response.time.time) * len_night;
              res += (24 - message.response.time.sunset) * len_night;
              res += message.response.time.sunrise * len_night;
            } else if (message.response.time.time < message.response.time.sunrise) {
              res = (message.response.time.sunrise - message.response.time.time) * len_night;
            } else {
              res = (24 - message.response.time.time) * len_night;
              res += message.response.time.sunrise * len_night;
            }
            const realMinutes = Math.trunc(res);
            const realSeconds = Math.ceil(60 * (res % 1));
            this.server.DisplayMessage(false, true, `It is ${realMinutes} minutes and ${realSeconds} seconds left until sunrise`);
          }
          return true;
        });
      }
      if (message.broadcast && message.broadcast.teamMessage && message.broadcast.teamMessage.message.message.includes('!night')) {
        this.rustplus.sendRequest({
          getTime: {},
        }, (message) => {
          if (message.response && message.response.time) {
            let res = 0;
            const duskdawn = 0.5;
            const daylength = message.response.time.sunset - message.response.time.sunrise - (duskdawn * 2);
            const nightlength = 24 - daylength;
            const len_day = ((message.response.time.dayLengthMinutes * message.response.time.timeScale) - nightlength) / daylength;
            const len_night = nightlength / (24 - daylength);

            if (message.response.time.time > message.response.time.sunrise && message.response.time.time < message.response.time.sunset) {
              if (message.response.time.time < message.response.time.sunrise + duskdawn) {
                res = (message.response.time.sunrise + duskdawn - message.response.time.time) * len_night;
                res += (message.response.time.sunset - duskdawn - (message.response.time.sunrise + duskdawn)) * len_day;
                res += duskdawn * len_night;
              } else if (message.response.time.time < message.response.time.sunset - duskdawn) {
                res = (message.response.time.sunset - duskdawn - message.response.time.time) * len_day;
                res += duskdawn * len_night;
              } else res = (message.response.time.sunset - message.response.time.time) * len_night;
            } else if (message.response.time.time < message.response.time.sunrise) {
              res = (message.response.time.sunrise - message.response.time.time) * len_night;
              res += daylength * len_day;
              res += (duskdawn * 2) * len_night;
            } else {
              res = (24 - message.response.time.time) * len_night;
              res += message.response.time.sunrise * len_night;
              res += daylength * len_day;
              res += (duskdawn * 2) * len_night;
            }
            const realMinutes = Math.trunc(res);
            const realSeconds = Math.ceil(60 * (res % 1));
            this.server.DisplayMessage(false, true, `It is ${realMinutes} minutes and ${realSeconds} seconds left until sunset`);
          }
          return true;
        });
      }
      if (message.broadcast && message.broadcast.teamMessage && message.broadcast.teamMessage.message.message.includes('!patrol')) {
        const lastSpawn = new Date().getMinutes() - this.currentMapMarkers.patrolHeli[2].getMinutes();
        this.server.DisplayMessage(false, true, `The patrol helicopter is ${this.currentMapMarkers.patrolHeli[0] ? 'out' : 'not out'} currently and they were last taken ${lastSpawn} minutes ago`);
      }
      if (message.broadcast && message.broadcast.teamMessage && message.broadcast.teamMessage.message.message.includes('!bradley')) {
        const lastSpawn = new Date().getMinutes() - this.currentMapMarkers.bradleyCrate[2].getMinutes();
        this.server.DisplayMessage(false, true, `Bradley is ${this.currentMapMarkers.bradleyCrate[0] ? 'on the map' : 'not on the map'} currently and they were last taken ${lastSpawn} minutes ago`);
      }
      if (message.broadcast && message.broadcast.teamMessage && message.broadcast.teamMessage.message.message.includes('!large')) {
        const lastSpawn = new Date().getMinutes() - this.currentMapMarkers.largeoilrig[2].getMinutes();
        this.server.DisplayMessage(false, true, `Large oil crates have ${this.currentMapMarkers.largeoilrig[0] ? 'spawned' : 'not spawned'} and they were last looted ${lastSpawn} minutes ago`);
      }
      if (message.broadcast && message.broadcast.teamMessage && message.broadcast.teamMessage.message.message.includes('!small')) {
        const lastSpawn = new Date().getMinutes() - this.currentMapMarkers.smalloilrig[2].getMinutes();
        this.server.DisplayMessage(false, true, `Small oil crates have ${this.currentMapMarkers.smalloilrig[0] ? 'spawned' : 'not spawned'} and they were last looted ${lastSpawn} minutes ago`);
      }
      if (message.broadcast && message.broadcast.teamMessage && message.broadcast.teamMessage.message.message.includes('!cargo')) {
        const lastSpawn = new Date().getMinutes() - this.currentMapMarkers.cargo[2].getMinutes();
        this.server.DisplayMessage(false, true, `Cargo is ${this.currentMapMarkers.cargo[0] ? 'currently' : 'not currently'} active and last spawned ${lastSpawn} minutes ago`);
      }
    });
  };

  getMonumentCoordinates() {
    this.rustplus.getMap((message) => { this.monumentCoordinates = message.response.map.monuments; });

  }

  checkMapMarkers = async () => {
    this.rustplus.getMapMarkers((message) => {
    if(message.response.mapMarkers === null){
      console.log('No response given')
      return;
    }
      for (const [key, value] of Object.entries(this.currentMapMarkers)) {
        value[1] = false;
      }

      message.response.mapMarkers.markers.forEach((mapMarker) => {
        switch (mapMarker.type) {
          case 2:
            let hasCheckedForBradley = false;
            this.monumentCoordinates.forEach((monument) => {
              if (util.inRange(mapMarker.x, monument.x - MONUMENTRANGE, monument.x + MONUMENTRANGE) && util.inRange(mapMarker.y, monument.y - MONUMENTRANGE, monument.y + MONUMENTRANGE)) {
                if (monument.token === 'launchsite') {
                  if (this.updateMapMarkers(this.currentMapMarkers.bradleyCrate)) { this.server.DisplayMessage(true, true, `Bradley just got taken! @ ${new Date().toLocaleTimeString()}`); }
                  hasCheckedForBradley = true;
                }
              }
            });
            if (!hasCheckedForBradley) {
              if (this.updateMapMarkers(this.currentMapMarkers.patrolHeliCrate)) { this.server.DisplayMessage(true, true, `Patrol heli just got taken! @ ${new Date().toLocaleTimeString()}`); }
            }
            break;
          case 5:
            if (this.updateMapMarkers(this.currentMapMarkers.cargo)) { this.server.DisplayMessage(true, true, `Cargo spawned! @ ${new Date().toLocaleTimeString()}`); }
            break;
          case 6:
            this.monumentCoordinates.forEach((monument) => { // TODO: Add fix for Cargo setting these off by accident.
              if (util.inRange(mapMarker.x, monument.x - MONUMENTRANGE, monument.x + MONUMENTRANGE) && util.inRange(mapMarker.y, monument.y - MONUMENTRANGE, monument.y + MONUMENTRANGE)) {
                if (monument.token === 'oil_rig_small') {
                  if (this.updateMapMarkers(this.currentMapMarkers.smalloilrig)) { this.server.DisplayMessage(true, true, `Small rig just respawned! @ ${new Date().toLocaleTimeString()}`); }
                }
                if (monument.token === 'large_oil_rig') {
                  if (this.updateMapMarkers(this.currentMapMarkers.largeoilrig)) { this.server.DisplayMessage(true, true, `Large rig just respawned! @ ${new Date().toLocaleTimeString()}`); }
                }
                if (monument.token !== 'large_oil_rig' && monument.token !== 'oil_rig_small') {
                  if (this.updateMapMarkers(this.currentMapMarkers.chinook)) { this.server.DisplayMessage(true, true, `Chinook crate just dropped at ${monument.token} @ ${new Date().toLocaleTimeString()}`); }
                }
              }
              // if (isMarkerNearMonument === '') { } TODO: Cant figure out a way to do deal with 3 crates on cargo, will probs need to change how currentMapMarkers work.
            });
            break;
          case 8:
            if (this.updateMapMarkers(this.currentMapMarkers.lockpatrolHeliedCrate)) { this.server.DisplayMessage(true, true, `The patrol heli just spawned! @ ${new Date().toLocaleTimeString()}`); }
            break;
        }
      });

      for (const [key, value] of Object.entries(this.currentMapMarkers)) {
        if (!value[1] && value[0]) {
          value[0] = false;
          switch (key) {
            case 'smalloilrig':
              this.server.DisplayMessage(true, true, 'Small oil was just looted!');
              break;
            case 'largeoilrig':
              this.server.DisplayMessage(true, true, 'Large oil was just looted!');
              break;
            case 'chinook':
              this.server.DisplayMessage(true, true, 'Chinook was just looted!');
              break;
          }
        }
      }
    });
  };

  updateMapMarkers(mapMarkerToTest) {
    let eventUpdate = false;
    if (!mapMarkerToTest[0]) {
      mapMarkerToTest[0] = true;
      eventUpdate = true;
      mapMarkerToTest[2] = new Date();
    }
    mapMarkerToTest[1] = true;
    return (eventUpdate);
  }

  sendTeamMessage(message) {
    this.rustplus.sendTeamMessage(message);
  }
}

module.exports = RustBot;
