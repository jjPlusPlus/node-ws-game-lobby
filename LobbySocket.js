import http from "http";
// import url from "url";
import WebSocket from "ws";
import LobbyState from "./LobbyState.js";

const server = http.createServer();

const LobbySocket = new WebSocket.Server({ server: server, path: "/lobby" });
const state = new LobbyState({server: server});

LobbySocket.on("connection", (ws) => {
  ws.on("open", (msg) => {
    console.log("socket opened");
  });

  ws.on("upgrade", () => {
    console.log("socket upgraded: handle auth here");
  });

  ws.on("message", (msg) => {

    let message = JSON.parse(msg);
    console.log(message);

    switch (message.type) {
      case "JOIN_LOBBY":
        console.log("adding a player to the lobby, then broadcasting updated state");
        state.playerOnline(message.player);
        broadcastUpdate();
        break;
      case "PLAYER_DISCONNECTED": 
        console.log("removing a player from the lobby, then broadcasting update");
        state.playerOffline(message.player);
        broadcastUpdate();
        break;
      case "PLAYER_READY": 
        console.log("adding a player to the matchmaking queue");
        state.playerReadyForMM(message.player, LobbySocket);
        broadcastUpdate();
        break;
      case "PLAYER_CANCEL":
        console.log("removing a player from the matchmaking queue");
        state.playerExitMM(message.player);
        broadcastUpdate();
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

LobbySocket.on("close", (ws) => {
  ws.send("server closed");
});

LobbySocket.on("error", (ws) => {
  ws.send("server error");
});

function broadcastUpdate() {
  LobbySocket.clients.forEach((client) => {
    client.send(JSON.stringify({ type: "UPDATE_LOBBY", state }));
  });
}

server.listen(8080);

export default LobbySocket;