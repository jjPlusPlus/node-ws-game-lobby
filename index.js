import LobbySocket from "./LobbySocket.js";
import express from "express";

const app = express();
const port = 8000;

app.get('/users', (req, res) => {
  res.send("A list of all users (online or otherwise)");
});

app.get('/matches', (req, res) => {
  res.send("A list of current matches");
});

app.listen(port, () => {
  console.log(`Express listening on port ${port}`)
});