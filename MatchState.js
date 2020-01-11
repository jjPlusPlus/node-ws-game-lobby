import words from "./words.js";
import _ from "lodash";

const ROUND_TIME = process.env.ROUND_TIME || 60;
const COUNTDOWN_TIMER = process.env.COUNTDOWN_TIMER || 10;
const NUM_ROUNDS = process.env.NUM_ROUNDS || 10;

export default class MatchState {
  constructor() {
    this.state = {
      ready: false,
      countdown: COUNTDOWN_TIMER,
      roundTime: ROUND_TIME,
      players: [],
      round: 0,
      currentWord: null,
      winner: null,
    }
    this.words = this.generateWords(NUM_ROUNDS)
  }

  async startMatch(socket) {
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

      while (this.state.roundTime > 0) {
        yield sleep(1000);
        socket.clients.forEach((client) => {
          client.send(JSON.stringify({ type: "ROUND_TIMER", state: { word: currentWord, timer: this.state.roundTime } }));
        });
      }
    }
  }

  sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async waitForPlayers() {

  }

  async generateWords(numWords) {
    const shuffle = _.shuffle(words);
    const take = shuffle.slice(numWords - 1);
    console.log(take);
    return take;
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

  async handlePlayerSkip(player, word) {

  }

  async handlePlayerScored(player, word) {
    
  }
}