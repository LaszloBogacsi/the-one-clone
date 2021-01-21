#!/usr/bin/env node

/**
 * Module dependencies.
 */
import {app} from './app'
import {Socket} from "socket.io";
var debug = require('debug')('the-one-clone-api:server');
var http = require('http');
var socketIO = require('socket.io')
const Room2 = require("./Room2");

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
    refactor to reducer pattern
    add more events for game play (turn-start, hint-start, hint-end, guess-end, result-start, result-end, game-over-start, game-over-end)

*/

const sockio = io.of("/")
sockio.on('connection', async (socket: Socket) => {
        console.log("connected...")
    // @ts-ignore
    const {roomId, playerName, action} = socket.handshake.query
    console.log(`${roomId}, ${playerName}, ${action}`)
    const room = new Room2({io: sockio, roomId, playerName, action, socket})
    await room.initialize()
    // room.showPlayers()
    room.playerJoinedLobby()
    room.isReady() // this just register a handler
    room.showGameState()
    // room.registerGameHandlers()
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
