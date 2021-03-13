#!/usr/bin/env node

/**
 * Module dependencies.
 */
import {app} from './app'
import {Socket} from "socket.io";
import {WordRepository} from "./Room2";

var debug = require('debug')('the-one-clone-api:server');
var http = require('http');
var socketIO = require('socket.io')
const {Room2} = require("./Room2");

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: '*',
    }
});

/*
    TODO
    refactor to reducer pattern
*/
const fs = require('fs')

const sockio = io.of("/")
function readWords() {
    const file = fs.readFileSync('./src/words.txt', {encoding: 'utf8'});
    return [...file.split("\n").map((d: string) => d.trim())]
    // return ["secret", "words", "guessing"];

}

sockio.on('connection', async (socket: Socket) => {
        console.log("connected...")
        // @ts-ignore
        const {roomId, playerName, action} = socket.handshake.query
        console.log(`${roomId}, ${playerName}, ${action}`)
        const words = readWords();
        const wordRepository: WordRepository = {
            getRandomWord: (): string =>  {

                return words[Math.floor(Math.random() * words.length)]
            }
        }
        const room = new Room2({io: sockio, roomId, playerName, action, socket, wordRepository})
        const hasJoined = await room.initialize()
        if (hasJoined) {
            room.playerJoinedLobby()
            room.isReady()
            room.showGameState()
        } else {
            console.log("join failed, disconnecting socket")
            socket.emit("end-game", {inLobby: true})

            socket.disconnect(true);
        }
        room.onDisconnect()
    }
);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val: any) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error: any) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    debug('Listening on ' + bind);
}
