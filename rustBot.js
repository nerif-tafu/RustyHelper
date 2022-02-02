const RustPlus = require('@liamcottle/rustplus.js');
const util = require('./util');

const MONUMENTRANGE = 50; // TODO: Change this back to 200 once you fix cargo setting off the chinook events

class RustBot {
  constructor(server) {
    this.server = server;

    this.currentMapMarkers = {
      patrolHeli: {currentlyOut: false, lastSeenChecks: 4, lastSeen: new Date()},
      patrolHeliCrate: {currentlyOut: false, lastSeenChecks: 4, lastSeen: new Date()},
      chinookCrate: {currentlyOut: false, lastSeenChecks: 4, lastSeen: new Date()},
      bradleyCrate: {currentlyOut: false, lastSeenChecks: 4, lastSeen: new Date()},
      smallOilRig: {currentlyOut: false, lastSeenChecks: 4, lastSeen: new Date()},
      largeOilRig: {currentlyOut: false, lastSeenChecks: 4, lastSeen: new Date()},
      cargo: {currentlyOut: false, lastSeenChecks: 4, lastSeen: new Date()}
    }

    this.rustplus = new RustPlus(this.server.rustServerIP, this.server.rustServerPort, this.server.steamID, this.server.rustPlusToken);
  }

  startRustBot = () => {
    this.rustplus.connect();

    this.rustplus.on('connected', () => {
      this.getMonumentCoordinates();
      util.setIntervalAsync(this.checkMapMarkers, 2000); // Setup map marker checks every 5 seconds.
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
        const lastSpawn = new Date().getMinutes() - this.currentMapMarkers.patrolHeli.lastSeen.getMinutes();
        this.server.DisplayMessage(false, true, `The patrol helicopter is ${this.currentMapMarkers.patrolHeli.currentlyOut ? 'out' : 'not out'} currently and they were last taken ${lastSpawn} minutes ago`);
      }
      if (message.broadcast && message.broadcast.teamMessage && message.broadcast.teamMessage.message.message.includes('!bradley')) {
        const lastSpawn = new Date().getMinutes() - this.currentMapMarkers.bradleyCrate.lastSeen.getMinutes();
        this.server.DisplayMessage(false, true, `Bradley is ${this.currentMapMarkers.bradleyCrate.currentlyOut ? 'on the map' : 'not on the map'} currently and they were last taken ${lastSpawn} minutes ago`);
      }
      if (message.broadcast && message.broadcast.teamMessage && message.broadcast.teamMessage.message.message.includes('!large')) {
        const lastSpawn = new Date().getMinutes() - this.currentMapMarkers.largeOilRig.lastSeen.getMinutes();
        this.server.DisplayMessage(false, true, `Large oil crates have ${this.currentMapMarkers.largeOilRig.currentlyOut ? 'spawned' : 'not spawned'} and they were last looted ${lastSpawn} minutes ago`);
      }
      if (message.broadcast && message.broadcast.teamMessage && message.broadcast.teamMessage.message.message.includes('!small')) {
        const lastSpawn = new Date().getMinutes() - this.currentMapMarkers.smallOilRig.lastSeen.getMinutes();
        this.server.DisplayMessage(false, true, `Small oil crates have ${this.currentMapMarkers.smallOilRig.currentlyOut ? 'spawned' : 'not spawned'} and they were last looted ${lastSpawn} minutes ago`);
      }
      if (message.broadcast && message.broadcast.teamMessage && message.broadcast.teamMessage.message.message.includes('!cargo')) {
        const lastSpawn = new Date().getMinutes() - this.currentMapMarkers.cargo.lastSeen.getMinutes();
        this.server.DisplayMessage(false, true, `Cargo is ${this.currentMapMarkers.cargo.currentlyOut ? 'currently' : 'not currently'} active and last spawned ${lastSpawn} minutes ago`);
      }
    });
  };

  getMonumentCoordinates() {
    this.landMonuments = [];
    this.landMinMaxCoords = {minX: 9999999, maxX: 0, minY: 9999999, maxY:0}
    this.seaMonuments = [];

    const majorLandMonuments = ['harbor_2_display_name', 'harbor_display_name','launchsite','excavator','junkyard_display_name', 'train_tunnel_display_name',
      'power_plant_display_name','train_yard_display_name','airfield_display_name','water_treatment_plant_display_name','sewer_display_name',
      'satellite_dish_display_name', 'dome_monument_name', 'mining_outpost_display_name','supermarket','gas_station','lighthouse_display_name'];

    const majorSeaMonuments = ['oil_rig_small', 'large_oil_rig'];

    this.rustplus.getMap((res) => { 
      res.response.map.monuments.forEach((monument) => {
        if (majorLandMonuments.includes(monument.token)) { 
          this.landMonuments.push(monument);
          if (monument.x < this.landMinMaxCoords.minX) { this.landMinMaxCoords.minX = monument.x; }
          if (monument.y < this.landMinMaxCoords.minY) { this.landMinMaxCoords.minY = monument.y; }
          if (monument.x > this.landMinMaxCoords.maxX) { this.landMinMaxCoords.maxX = monument.x; }
          if (monument.y > this.landMinMaxCoords.maxY) { this.landMinMaxCoords.maxY = monument.y; }
        } else if (majorSeaMonuments.includes(monument.token)){
          this.seaMonuments.push(monument);
        }
      }) 
    });
  }

  checkMapMarkers = async () => {
    this.rustplus.getMapMarkers((message) => {

      // If no response is received.
      if(message.response.mapMarkers === null){
        console.log('No response given')
        return;
      }

      for (const [marker, markerProperties] of Object.entries(this.currentMapMarkers)) {
        markerProperties.lastSeenChecks +=1;
      }
    
      message.response.mapMarkers.markers.forEach((mapMarker) => { // For each marker sent 
        switch (mapMarker.type) {
          case 2: 
          // If it was an explosion
            let hasCheckedForBradley = false;
            this.landMonuments.forEach((monument) => {
              if (!util.inRange(mapMarker.x, monument.x - 300, monument.x + 300) || !util.inRange(mapMarker.y, monument.y - 300, monument.y + 300)) { return; }
              if (monument.token !== 'launchsite') { return; }
              if (!this.currentMapMarkers.bradleyCrate.currentlyOut) { this.server.DisplayMessage(true, true, `Bradley just got taken! @ ${new Date().toLocaleTimeString()}`); }
              this.mapMarkerPresent(this.currentMapMarkers.bradleyCrate)
              hasCheckedForBradley = true;     
            });
            if (hasCheckedForBradley) { return; }          
            if (!this.currentMapMarkers.patrolHeliCrate.currentlyOut) { this.server.DisplayMessage(true, true, `Patrol heli just got taken! @ ${new Date().toLocaleTimeString()}`); }
            this.mapMarkerPresent(this.currentMapMarkers.patrolHeliCrate)
            break;
          case 5:
            //If it was cargo
            if (!this.currentMapMarkers.cargo.currentlyOut) { this.server.DisplayMessage(true, true, `Cargo spawned! @ ${new Date().toLocaleTimeString()}`); }
            this.mapMarkerPresent(this.currentMapMarkers.cargo);
            break;
          case 6:
            // If it was a locked crate
            this.seaMonuments.forEach((monument) => { // TODO: Add fix for Cargo setting these off by accident.
              if (!util.inRange(mapMarker.x, monument.x - 30, monument.x + 30) || !util.inRange(mapMarker.y, monument.y - 30, monument.y + 30)) { return; }
              
              if (monument.token === 'oil_rig_small') {
                if (!this.currentMapMarkers.smallOilRig.currentlyOut) { this.server.DisplayMessage(true, true, `Small rig just respawned! @ ${new Date().toLocaleTimeString()}`); }
                this.mapMarkerPresent(this.currentMapMarkers.smallOilRig)    
              }
              
              if (monument.token === 'large_oil_rig') {
                if (!this.currentMapMarkers.largeOilRig.currentlyOut) { this.server.DisplayMessage(true, true, `Large rig just respawned! @ ${new Date().toLocaleTimeString()}`); }
                this.mapMarkerPresent(this.currentMapMarkers.largeOilRig)
              }   
            });
            this.landMonuments.forEach((monument) => {
              if (!util.inRange(mapMarker.x, monument.x - 300, monument.x + 300) || !util.inRange(mapMarker.y, monument.y - 300, monument.y + 300)) { return; }
              if (!util.inRange(monument.x, this.landMinMaxCoords.minX - 100, this.landMinMaxCoords.maxX + 100) || !util.inRange(!monument.y, this.landMinMaxCoords.minY - 100, this.landMinMaxCoords.maxY + 100)) { return; }              
              if (!this.currentMapMarkers.chinookCrate.currentlyOut) { this.server.DisplayMessage(true, true, `Chinook crate just dropped at ${monument.token} @ ${new Date().toLocaleTimeString()}`); }
              this.mapMarkerPresent(this.currentMapMarkers.chinookCrate)
            })
            break;
          case 8:
            // It it was patrol heli
            if (!this.currentMapMarkers.patrolHeli.currentlyOut) { this.server.DisplayMessage(true, true, `The patrol heli just spawned! @ ${new Date().toLocaleTimeString()}`); }      
            this.mapMarkerPresent(this.currentMapMarkers.patrolHeli)
            break;
        }
      });
    });

    for (const [marker, markerProperties] of Object.entries(this.currentMapMarkers)) {
      if (markerProperties.lastSeenChecks <= 3) { continue; }
      if (markerProperties.currentlyOut) {
        if (marker === 'smalloilrig') { this.server.DisplayMessage(true, true, 'Small oil was just looted!'); }
        if (marker === 'largeoilrig') { this.server.DisplayMessage(true, true, 'Large oil was just looted!'); }
        if (marker === 'chinookCrate') { this.server.DisplayMessage(true, true, 'Chinook was just looted!'); }
      }
      markerProperties.currentlyOut = false;
    }
  };

  mapMarkerPresent(mapMarkerToTest) {
    mapMarkerToTest.lastSeenChecks = 0;
    mapMarkerToTest.currentlyOut = true;
    mapMarkerToTest.lastSeen = new Date();
  }

  sendTeamMessage(message) {
    this.rustplus.sendTeamMessage(message);
  }
}

module.exports = RustBot;
