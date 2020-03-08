# Documentation  

## LobbySocket


---  

## MatchSocket 


---  

## LobbyState 
__state attributes__  
offline: Array  
online: Array  
matchMakingQueue: Object { waiting: Array, groups: Array }  
matches: Array  

__private methods__  
playerOnline(Player)  
playerOffline(Player)  
playerReadyForMM(Player, Socket)  
playerExitMM(Player)

---  

## MatchState  
__state attributes__  
ready: boolean    
countdown: integer  
roundTime: integer  
round: integer  
players: Array 
words: Array 
currentWord: Word 
winner: Player 

__private methods__  
generateWords(length)  
playerJoined(Player, Socket)  
startMatch()  
startRound()  
playerDisconnected(Player)  
handlePlayerScored()  
handlePlayerSkip()
