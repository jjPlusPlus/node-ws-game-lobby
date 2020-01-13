import words from "./words.js";
import _ from "lodash";

const ROUND_TIME = process.env.ROUND_TIME || 60;
const COUNTDOWN_TIMER = process.env.COUNTDOWN_TIMER || 10;
const NUM_ROUNDS = process.env.NUM_ROUNDS || 10;

export default class MatchState {
  constructor(params) {
    this.state = {
      ready: false,
      countdown: COUNTDOWN_TIMER,
      roundTime: ROUND_TIME,
      players: params.players || [],
      round: 0,
      words: this.generateWords(NUM_ROUNDS),
      currentWord: null,
      winner: null,
    }
  }

  generateWords(numWords) {
    const shuffle = _.shuffle(words);
    const take = shuffle.slice(0, 10);
    return take;
  }

  async playerJoined(player, socket) {
    const playerIndex = this.state.players.findIndex((pl) => pl.id === player.id);

    if (playerIndex === -1) {
      return console.error("couldn't find a player with a matching ID");
    }
    this.state.players[playerIndex].online = true;

    socket.clients.forEach((client) => {
      client.send(JSON.stringify({ type: "UPDATE_MATCH", state: this.state }));
    });

    // All of the players have joined if all of the players array has 'online' true
    const readyToStart = this.state.players.filter((p) => p.online === false).length === 0;
    if (readyToStart) {
      console.log("all players have joined");
      await this.startMatch(socket);
    }
  }

  async startMatch(socket) {
    console.log('starting match');

    // BROADCAST THE READY STATE
    this.state.ready = true;
    socket.clients.forEach((client) => {
      client.send(JSON.stringify({ type: "MATCH_READY" }));
    });

    // PRE-MATCH COUNTDOWN TIMER
    while (this.state.countdown > 0) {
      yield this.sleep(1000);
      this.state.countdown -= 1;
      socket.clients.forEach((client) => {
        client.send(JSON.stringify({ type: "UPDATE_MATCH", state: this.state }));
      });
    }

    // Once the countdown reaches 0
    while (this.state.countdown === 0) {
      /* fr start the match 
       * FOR EACH ROUND: 
       *   set the current word  
       *   start the countdown timer 
       *   broadcast the time each second
       * TO DO: 
       *   handle looping through each word
       *   handle when a player scores
      */
      const round = this.state.round;
      const currentWord = this.words[round]; 
      this.state.roundTime = ROUND_TIME;
      socket.clients.forEach((client) => {
        client.send(JSON.stringify({ type: "ROUND_UPDATE", state: { word: currentWord, timer: this.state.roundTime } }));
      });

    // MATCH IS OVER
    while (this.state.countdown === 0 && this.state.round === this.state.words.length && this.state.ready === true) {
      this.state.ready = false;
      // what if all players have 0? who is the winner? 
      // what if only 2 of 3 players have the highest 
      const players = this.state.players.slice();
      
      let highScore, draw, tie, winners, winner;


      highScore = players.reduce((acc, player) => player.score > acc.score ? player : acc);

      winners = players.filter((p) => p.score === highScore.score);

      // if ALL players have the same score, then it's a draw
      draw = winners.length === players.length;

      // tie is more than one player have the highest score, but not all
      tie = winners.length < players.length && winners.length > 1;

      let testTernary = draw ? draw : (tie ? tie : winners);

      let result;

      if (draw) {
        result = {
          result: "draw",
          winners: null
        }
      } else if (tie) {
        result = {
          result: "tie",
          winners: winners
        }
      } else {
        result = {
          result: "winner",
          winner: winners
        }
      }

      socket.clients.forEach((client) => {
        client.send(JSON.stringify({ type: "MATCH_OVER", state: this.state, result }));

  async waitForPlayers() {

  }

    return;
  }

  async addPlayer(player, players, socket) {
    // change a player's state to 'online'
    player.score = 0;
    this.state.players.push(player);

    socket.clients.forEach((client) => {
      client.send(JSON.stringify({ type: "UPDATE_MATCH", state: this.state }));
    });

    // All of the players have joined
    if (this.state.players.length === players.length) {
      socket.clients.forEach((client) => {
        client.send(JSON.stringify({ type: "MATCH_READY" }));
      });
      this.startMatch(socket);
    }
  }

  async playerDisconnected(player) {
    // change a player's state to 'offline'
    this.state.players.push(player);
  }

  async handlePlayerScored(player, word, socket) {
    // TODO: make sure that the word is valid 
    console.log(player.name);
    console.log(word.word);
    // increase score for the player in question based on the time left
    const playerIndex = this.state.players.findIndex((pl) => pl.id === player.id);
    this.state.players[playerIndex].score += 100 + this.state.roundTime;
    // update currentWord & reset the round timer
    this.state.round += 1;
    this.state.roundTime = ROUND_TIME;
    this.state.currentWord = this.state.words[this.state.round];
    
    socket.clients.forEach((client) => {
      client.send(JSON.stringify({ type: "UPDATE_MATCH", state: this.state }));
    });
    socket.clients.forEach((client) => {
      client.send(JSON.stringify({ type: "PLAYER_SCORED", payload: { player, word } }));
    });
  }

  async handlePlayerSkip(player, word) {

  }
}