import _ from "lodash";
import AWS from "aws-sdk";

AWS.config.update({ region: 'eu-west-1' });
const cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();

// TODO: declare this in .env
const MATCH_SIZE = process.env.MATCH_SIZE || 2;

/* CLASS LobbyState
 * Manages the internal state of the Lobby, possibly to be replaced by a local Redis database
 * ... Or converted into the interface between the socket server & Redis
 * LobbyState.state = the current state of the lobby, incl. all players on and offline, the queue, and matches
*/

export default class LobbyState {
  constructor() {
    this.state = {
      offline: [],
      online: [],
      matchMakingQueue: {
        groups: [],
        waiting: []
      },
      matches: [],
    }
    cognitoidentityserviceprovider.listUsers({ UserPoolId: "eu-west-1_vLaPCLiOu" }, (err, data) => {
      return this.state.offline = data.Users;
    })
  }

  async fetchPlayers() {
    // hit the database and return all players
  }

  async playerOnline(player) {
    // change a player's state to 'online'
    this.state.online.push(player);
  }

  async playerOffline(player) {
    // change a player's state to 'offline'
    const onlinePlayers = this.state.online;

    // first, make sure player is already "online"
    if (_.some(onlinePlayers, { id: player })) {
      const where = _.find(onlinePlayers, { id: player });
      const index = _.indexOf(onlinePlayers, where);
      const playersCopy = onlinePlayers.slice();
      playersCopy.splice(index, 1);
      this.state.online = playersCopy;
    }
  }

  async playerReadyForMM(player) {
    const waiting = this.state.matchMakingQueue.waiting.slice();
    if (!_.some(waiting, { id: player.id })) {
      waiting.push(player);
      this.state.matchMakingQueue.waiting = waiting;
    }

    if (this.state.matchMakingQueue.waiting.length >= MATCH_SIZE) {
      const group = this.state.matchMakingQueue.waiting.slice();
      this.state.matchMakingQueue.groups.push(group);
      this.state.matchMakingQueue.waiting = [];
    }
  }

  async playerExitMM(player) {
    const waiting = this.state.matchMakingQueue.waiting.slice();
    if (_.some(waiting, { id: player.id })) {
      const where = _.find(waiting, { id: player });
      const index = _.indexOf(waiting, where);
      waiting.splice(index, 1);
      this.state.matchMakingQueue.waiting = waiting;
    }
  }

  async addMatch() {

  }

  async updateMatch() {
    // update a match
  }

  async removeMatch() {
    // remove a match
  }


}