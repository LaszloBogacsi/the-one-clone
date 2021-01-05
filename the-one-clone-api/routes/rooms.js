const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const io = require("../bin/www")

class Room {
  constructor(id) {
    this.id = id;
    this.players = [];
    this.games = [];
  }

  join(username)  {
    this.players.push(username)
  }

  addGame(game) {
    this.games.push(game)
  }

}


class Game {
  constructor(id) {
    this.id = id;
    this.isOngoing = true
    this.rounds = []
  }

  addRoundResult(round)  {
    this.rounds.push(round)
  }

}

const room = new Room("85905935-5fe0-4e59-bf77-f1f3f419fb19");
room.join("Bogi")
const rooms = {[room.id]: room}
// return the room
router.post('/create', function(req, res, next) {
  const roomId = uuidv4()
  const body = req.body
  const roomCreatorName = body.playerName
  const room = new Room(roomId)
  room.join(roomCreatorName)
  rooms[roomId] = (room)
  console.log(rooms)
  const response = {room}
  res.status(200).send(response);
});

router.post('/join/:roomId', function(req, res, next) {
  const roomId = req.params["roomId"]
  const body = req.body
  const playerName = body.playerName
  const room = rooms[roomId]

  room.join(playerName)
  const response = {room}
  res.status(200).send(response);
});


// return the game
router.post('/create-game', function(req, res, next) {
  const gameId = uuidv4()
  const body = req.body
  const roomId = req.query["room-id"]
  const game = new Game(gameId)
  rooms[roomId].addGame(game)
  const response = {game}
  res.status(200).send(response);
});

module.exports = router;
