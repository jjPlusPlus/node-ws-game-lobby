import _ from "lodash";
import AWS from "aws-sdk";
import MatchSocket from "./MatchSocket.js";


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
  constructor(params) {
    this.state = {
      offline: [],
      online: [],
      matchMakingQueue: {
        groups: [],
        waiting: [],
      },
      matches: [],
    }

    this.channels = [
      { name: "alpha", port: 8001, occupied: false },
      { name: "bravo", port: 8002, occupied: false },
      { name: "charlie", port: 8003, occupied: false },
      { name: "delta", port: 8004, occupied: false },
      { name: "echo", port: 8005, occupied: false },
      { name: "foxtrot", port: 8006, occupied: false },
      { name: "kilo", port: 8007, occupied: false },
      { name: "tango", port: 8008, occupied: false },
      { name: "xray", port: 8009, occupied: false },
    ];

    this.server = params.server || null;

    cognitoidentityserviceprovider.listUsers({ UserPoolId: "eu-west-1_vLaPCLiOu" }, (err, data) => {
      return this.state.offline = data.Users;
    });
  
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

  // TODO: handle when there are no open channels: create a queue
  async playerReadyForMM(player, socket) {

    // add the player to the waiting list
    const waiting = this.state.matchMakingQueue.waiting.slice();
    if (!_.some(waiting, { id: player.id })) {
      waiting.push(player);
      this.state.matchMakingQueue.waiting = waiting;
    }

    if (this.state.matchMakingQueue.waiting.length >= MATCH_SIZE) {

      // if there are enough players, form a new group
      const group = this.state.matchMakingQueue.waiting.slice();
      
      // 1. move the players into a new group
      this.state.matchMakingQueue.groups.push(group);

      // 2. clear out the wait list
      this.state.matchMakingQueue.waiting = [];

      // 3. find an open channel
      const openChannels = this.channels.filter((ch) => {
        return ch.occupied === false;
      });
      const channel = openChannels[0];
      const channelIndex = this.channels.findIndex((ch) => ch.name === channel.name);

      // 4. set that channel's "occupied" state to true so we know it's in use
      this.channels[channelIndex].occupied = true;

      // 5. spawn a new MatchSocket for this match 
      const match = new MatchSocket({ channel: channel, players: group }); 

      // 6. add the new match to the list
      this.state.matches.push(match);

      // 7. remove the group
      
      // 8. broadcast to all listeners to start a match.
      //    this means that all players who are in the group need to route to the match view
      //    and subscribe to the new MatchSocket 
      //    Also, this means we will need access to the LobbySocket from here
      const broadcast = { players: group, channel: channel };
      socket.clients.forEach((client) => {
        client.send(JSON.stringify({ type: "NEW_MATCH", broadcast }));
      });
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