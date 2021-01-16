import {Namespace, Socket} from "socket.io";


interface Player {
    id: string
    playerName: string
    isReady: boolean
    isAdmin: boolean
    isGuessing: boolean
}

class Turn {
    public secretWord: string
    public hints = []
    public reveal = false
    public guess = ""

    constructor(chosenWord: string) {
        this.secretWord = chosenWord
    }
}

class Round {
    public turns: Turn[] = []
    public currentTurn = 0
    public points = 0

    constructor() {
    }

    addTurn(turn: Turn) {
        this.turns.push(turn)
    }
}

class GameConfig {
    constructor(
        public maxRounds: number,
        public hintTimeout: number,
        public guessTimeout: number,
        public maxTurn: number) {
    }
}

class GameState {
    public gameConfig: GameConfig;
    public rounds: Round[] = []
    public inLobby: boolean

    constructor(gameConfig: GameConfig) {
        this.gameConfig = gameConfig
        this.inLobby = true
    }

    addRound(round: Round): void {
        this.rounds.push(round)
    }

    currentRound(): number {
        return this.rounds.length - 1;
    }
}

class Room2 {
    private io: Namespace;
    private roomId: string
    private playerName: string
    private action: string
    private socket: Socket
    private store: any

    constructor(param: { io: Namespace, roomId: string, playerName: string, action: string, socket: Socket }) {
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
                this.store.clients.push({
                    id: this.socket.id,
                    playerName: this.playerName,
                    isReady: !gameState.inLobby,
                    isAdmin: false,
                    isGuessing: false
                } as Player)
                console.info(`[JOINED] Client ${this.socket.id} joined room ${this.roomId}`);
            } else {
                console.info(`[ERROR] Room ${this.roomId} does not exists, please create the room first`);
            }
        }

        if (this.action === 'create') {
            await this.socket.join(this.roomId)
            this.store = this.store.rooms.get(this.roomId)
            this.store.clients = [{
                id: this.socket.id,
                playerName: this.playerName,
                isReady: false,
                isAdmin: true,
                isGuessing: false
            } as Player]
            console.info(`[CREATE] Client ${this.socket.id} created and joined room ${this.roomId}`);
            this.resetGameState()
        }
    }

    playerJoinedLobby() {
        this.io.to(this.roomId).emit('player-joined-lobby', {playerJoined: this.store.clients.find((me: Player) => me.id === this.socket.id)})
    }

    isReady() {
        this.socket.on('on-ready', this._onReadyHandler.bind(this))
    }

    _onReadyHandler(data: { ready: boolean }) {
        this.store.clients.forEach((client: Player) => {
            if (client.id === this.socket.id) {
                client.isReady = data.ready
                this._emitOnReadyChange(client)
            }
        })
        const allPlayersReady = this.store.clients.every((client: Player) => client.isReady)
        if (allPlayersReady) this.startGame()
    }

    _emitOnReadyChange(client: Player) {
        this.io.to(this.roomId).emit('player-ready-change', {id: client.id, isReady: client.isReady})
    }

    showGameState() {
        this.io.to(this.roomId).emit('show-game-state', {gameState: this.store.gameState})
    }

    _getSecretWord() {
        const secretWords = ["secret", "words", "guessing"];
        return secretWords[Math.floor(Math.random() * secretWords.length)]
    }

    resetGameState() {
        const config = new GameConfig(
            2,
            20_000,
            50_000,
            3
        )
        this.store.gameState = new GameState(config)
    }

    /*

    ####  GAME  ####

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

    _emitStartGame(inLobby: boolean) {
        this.io.to(this.roomId).emit('start-game', {inLobby})
    }

    _emitRound(round: Round) {
        this.io.to(this.roomId).emit('start-round', {round})
    }

    _emitRoleGeneral(guesser: Player) {
        this.io.to(this.roomId).emit('player-roles', {guesser: {id: guesser.id, name: guesser.playerName}})
    }

    startGame() {
        this.resetGameState()
        const {clients, gameState} = this.store;

        // move to game from lobby
        gameState.inLobby = false;
        this._emitStartGame(this.store.gameState.inLobby)
        console.info(`[StartGame] Moving from lobby to game, in ${this.roomId} room`);

        // start new round and announce roles
        setTimeout(this._startNewRound.bind(this), 2000)


        const announceRoles = () => {
            clients.forEach((client: Player) => client.isGuessing = false)
            clients[0].isGuessing = true;
            const guesser: Player = clients[0];
            this._emitRoleGeneral(guesser)
            console.info(`[Roles] announcing guesser is ${guesser.playerName}, in ${this.roomId} room`);

        }

        setTimeout(announceRoles, 4000)
        setTimeout(this._startNewTurn.bind(this), 6000)

        console.info(`[CREATE] All players ready, Game starts in ${this.roomId} room`);
    }

    _startNewRound() {
        const round = new Round();
        this.store.gameState.addRound(round)
        this._emitRound(round)
        console.info(`[NEWROUND] New Round starting, in ${this.roomId} room`);

    }

    _emitNewTurn(turn: Turn) {
        this.io.to(this.roomId).emit('start-turn', {turn})
    }

    _startNewTurn() {
        const {gameState} = this.store;
        const {rounds, currentRound} = gameState;
        const turn = new Turn(this._getSecretWord());
        rounds[currentRound.call(gameState)].addTurn(turn)
        this._emitNewTurn(turn)
        console.info(`[NEWTURN] New Turn starting, in ${this.roomId} room`);

    }

}

module.exports = Room2;

