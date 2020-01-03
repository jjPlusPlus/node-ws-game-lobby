# node-ws-game-lobby
A websocket-driven game lobby built with Node
___  

## Overview  
This project uses Node and the WS module to run a lobby service. The responsibilities are split between three controllers: Lobby, MatchMaking, and Match.

## Features & Limitations  
- Requires Node 13 or higher to use ES module imports 
- Only one concurrent match (for now)
- Coupled to the BringMe game logic controller (for now)
- Image recognition managed by the player's client (open to hacky cheating)

## Channels 
There are two channels simultaneously managed by the server: one for the lobby, and one for the match service

__Lobby Channel: /lobby__   
The Lobby channel is responsible for handling player connections and match-making. The MatchMaking module will spawn a new MatchState object and channel by ID each time [_n_] players are waiting for a new match.

__Match Channel: /match/:id__  
The Match channel is responsible for the game logic of a match, broadcasting the current game state to all subscribed players.

## Internal State  
The server keeps track of the current status of the Lobby, as well as the state of any Matches.

__LobbyState__  
```
{
  offline: [
    {
      id,
      username,
    }, ...
  ],
  online: [
    {
      id,
      username,
      ready
    }, ...
  ],
  matchMakingQueue: {
    groups: {
      0: {
        players: [player0, ..., player5]
      }, ... 
    },
    waiting: {
      [
        {player},
        ...
        // up to 4
      ]
    }
  },
  matches: [
    {
      MatchState
    }
  ]
}
```

__MatchState__
```
{
  id,
  startedAt,
  finishedAt,
  players: [
    {
      id,
      username,
      score
    }, ...
  ]
  labels: [
    {
      word: "coffee",
      winner: playerId or null,
      completedIn: seconds
    }, ...
  ],
  currentWord: {
    word: "coffee"
    time: seconds
  }
}
```

## Planned Application Flow
- A Player registers with a (unique) Username
- A Player enters the /lobby
- The Player’s browser pings the WS server to subscribe to the Lobby channel, sending along the player object
- If the Player id matches a player in the users table, The WS server adds the player to the list of Online Players in the LobbyState object
- The WS server broadcasts the updated LobbyState object to the Lobby channel.

- The Player’s browser populates the Lobby view with: 
  - the list of all Players, the list of Online Players, the Matchmaking queue, and list of Active Matches
- The Player interacts with the “Enter MM” button
- The server adds the player to the MatchMaking queue. If at least 5 players are in matchmaking, the server groups them for a match (pushing to the top of the stack).

- The server broadcasts the new LobbyState
- Once the server is ready to start a new Match (need to decide how this works: one at a time? Concurrent, but max based on environment var integer?), 
- the Lobby server will start a new match:
  - Pops the first group from the bottom of the MM stack
  - Creates a new match record { uuid, players, startedAt }
  - Creates a new channel “match/uuid” based on match record
  - Picks n labels from a list and adds them to the match
  - Broadcasts a “matchStarting” object to the /lobby channel, passing the match UUID and players object
- The browser receives a “matchStarting” object in the /lobby channel. If the player’s UUID is in the list of players, the client’s browser will re-route to /matches/matchID. 
- When the player arrives in /matches/matchID, their browser will connect and subscribe to the /match/matchID channel. 
- Once all players in the match object have subscribed to the channel, the Match Server will start the match
  - Set the current word 
  - Start a countdown timer
 - Prepare the timer for the first word
- Once the countdown timer is down to zero, the match will start. The Match server will broadcast the first word with the time
- When the player’s browser receives a message in the /match/id channel with the label “currentWord”, the client will show the current word and show the time.
- Each time the player attempts to label an image, they will send the image to Rekognition and wait for labels. When the labels come back, they will internally check for a match. If a match happens, they will broadcast to the /match/id channel a message of “match” with their playerID. 
Basically, the first player whose browser broadcasts a “match” message will get the point
- The Match Server will score a point for that user, and send the next word
- Once the words run out, the Match Server will broadcast a “Game Over” message with the final Game Object and scores. 
- Players can exit the match and return to the lobby to restart the process
