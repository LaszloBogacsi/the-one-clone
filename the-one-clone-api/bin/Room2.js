class Room2 {
    constructor(param) {
        this.io = param.io;
        this.roomId = param.roomId;
        this.playerName = param.playerName;
        this.action = param.action;
        this.socket = param.socket;
        this.store = param.io.adapter;
    }

    async initialize() {

        if (this.action === 'join') {
            await this.socket.join(this.roomId)
            this.store = this.store.rooms.get(this.roomId)
            if (this.store.clients) {
                const {gameState} = this.store;
                this.store.clients.push({id: this.socket.id, playerName: this.playerName, isReady: !gameState.inLobby, isAdmin: false, isGuessing: false})
                this.socket.username = this.playerName;
                console.info(`[JOINED] Client ${this.socket.id} joined room ${this.roomId}`);
            } else {
                console.info(`[ERROR] Room ${this.roomId} does not exists, please create the room first`);
            }
        }

        if (this.action === 'create') {
            await this.socket.join(this.roomId)
            this.store = this.store.rooms.get(this.roomId)
            this.store.clients = [{id: this.socket.id, playerName: this.playerName, isReady: false, isAdmin: true, isGuessing: false}]
            this.socket.username = this.playerName;
            console.info(`[CREATE] Client ${this.socket.id} created and joined room ${this.roomId}`);
            this.resetGameState()
        }
    }

    playerJoinedLobby() {
        this.io.to(this.roomId).emit('player-joined-lobby', { playerJoined: this.store.clients.find(me => me.id === this.socket.id) })
    }

    isReady() {
        this.socket.on('on-ready', this._onReadyHandler)
    }

    // data: {ready: boolean}
    _onReadyHandler(data) {
        this.store.clients.forEach(client => {
            if (client.id === this.socket.id) {
                client.isReady = data.ready
                this._emitOnReadyChange(client)
            }
        })
        const allPlayersReady = this.store.clients.every(client => client.isReady)
        if (allPlayersReady) this.startGame()
    }

    _emitOnReadyChange(client) {
        this.io.to(this.roomId).emit('player-ready-change', { id: client.id, isReady: client.isReady })
    }


    resetGameState() {
        this.store.gameState = {
            rounds: [this.newRound()],
            currentRound: 0,
            maxRounds: 2,
            hintTimeout: 20_000,
            guessTimeout: 50_000,
            maxTurn: 3, // 13 turns
            inLobby: true
        }
    }

    /*
    ####  LOBBY  ####

    - player-joined-lobby <- done
    - player-ready <- done

    ####  GAME  #### // TODO(Continue from here)

    - game-start
    - round-announce (round: 1)
    - roles announce (Guesser: Player1)
    - hint-start
    .. timeout - hint
    - hint-status
    - hint-end ?
    - guess-start
    .. timeout guess
    - guess-end ?
    - guess-result
    ...
    ...
    ...
    - roles-announce
    ...
    - guess-result
    - round-result
    - round-announce
    ...
    ...
    - game-over
    - game-results

     */

    startGame() {
        this.resetGameState()
        const {clients, gameState} = this.store;
        gameState.inLobby = false;
        clients.forEach(client => client.isGuessing = false)
        clients[0].isGuessing = true;
        this.showPlayers()
        this.startHintTimeout()
        this.io.to(this.roomId).emit('start-game', {gameState: this.store.gameState})
        console.info(`[CREATE] All players ready, Game starts in ${this.roomId} room`);
    }

}

module.exports = Room2;

