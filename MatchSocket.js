import http from "http";
import WebSocket from "ws";
import MatchState from "./MatchState.js";

export default class MatchSocket {
  constructor(params) {

    this.state = new MatchState();
    this.players = params.players || [];
    this.server = http.createServer();

    try {
      this.server.listen(params.channel.port);
    } catch (error) {
      console.error("could not create the server at the specified port");
    }

    this.socket = new WebSocket.Server({ server: this.server, path: "/" + params.channel.name });

    this.socket.on("connection", (ws) => {

      // TODO: do something with these
      ws.on("open", (msg) => { console.log("match socket opened"); });
      ws.on("upgrade", () => { console.log("match socket upgraded: handle auth here"); });


      /* Message Controller
       * We will need messages when a player connects/disconnects from the match.
       * We will need to handle a message when a player scores a point 
       * We will need to handle a message when a player chooses to pass
      */
      ws.on("message", (msg) => {
        let message = JSON.parse(msg);
        console.log(message);

        switch (message.type) {
          case "JOIN_MATCH":
            console.log("adding a player to the match, then broadcasting updated state");
            this.state.addPlayer(message.player, this.players, this.socket);
            break;
          case "PLAYER_DISCONNECTED":
            console.log("removing a player from the match, then broadcasting update");
            this.state.playerDisconnected(message.player);
            this.broadcastUpdate(this.socket);
            break;
          case "PLAYER_SCORED": 
            console.log("A player scored a point");
            this.state.handlePlayerScored(message.player, message,word);
            break;
          case "PLAYER_PASSES":
            console.log("A player has chosen to skip the current word");
            this.state.handlePlayerSkip(message.player, message.word);
            break;
          default:
            console.log("new msg case not handled");
            break;
        }
      });

      ws.on("error", (err) => {
        console.log("socket error");
      });

      ws.on("close", () => {
        console.log("socket closed");
      });
    });
  }

  

  broadcastUpdate(socket) {
    socket.clients.forEach((client) => {
      client.send(JSON.stringify({ type: "UPDATE_MATCH", state }));
    });
  }
}