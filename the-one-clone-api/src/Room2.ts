import {Namespace, Socket} from "socket.io";
import {StartNewTurn} from "./StartNewTurn";
import {Emitter} from "./Emitter";
import {HintToDedupe} from "./HintToDedupe";
import {DedupeToGuess} from "./DedupeToGuess";
import {GuessToNewTurn} from "./GuessToNewTurn";
import {GameOver} from "./GameOver";
import {GameEvent} from "./GameEvent";
import {Countdown} from "./Countdown";


export interface Player {
    id: string
    playerName: string
    isReady: boolean
    isAdmin: boolean // TODO: use Role: "ADMIN" insted
    isGuessing: boolean
}

export type TurnResult = 'success' | 'failure' | 'skip'

export class Turn {
    public hints: Hint[];
    public reveal: boolean;
    public guess: string;
    public result?: TurnResult;
    public deduplication: boolean;
    public skip: boolean;

    constructor(public readonly secretWord: string) {
        this.hints = [];
        this.reveal = false;
        this.guess = "";
        this.deduplication = false;
        this.skip = false;
    }
}

export class Hint {
    constructor(
        public readonly player: Player,
        public readonly hint: string,
        public duplicate: boolean) {
    }
}

export class Round {
    public turns: Turn[] = []
    public points = 0
    public currentTurn = -1

    addTurn(turn: Turn) {
        this.turns.push(turn);
        this.currentTurn += 1;
    }
}

export class GameConfig {
    constructor(
        public maxRounds: number,
        public hintTimeout: number,
        public guessTimeout: number,
        public dedupeTimeout: number,
        public maxTurn: number) {
    }
}

export class GameState {
    public gameConfig: GameConfig;
    public rounds: Round[] = []
    public inLobby: boolean
    public currentRound: number

    constructor(gameConfig: GameConfig) {
        this.gameConfig = gameConfig
        this.inLobby = true
        this.currentRound = -1
    }

    addRound(round: Round): void {
        this.rounds.push(round)
        this.currentRound += 1
    }

}

type GameEventType = 'startNewTurn' | 'hintToDedupe' | 'dedupeToGuess' | 'guessToNewTurn' | 'hintCountDown' | 'dedupeCountDown' | 'guessCountDown'

export class Room2 {
    private io: Namespace;
    private roomId: string
    private playerName: string
    private action: string
    private socket: Socket
    private store: any
    private gameLoopEvents: Map<GameEventType, GameEvent>;
    private readonly emitter: Emitter;

    constructor(param: { io: Namespace, roomId: string, playerName: string, action: string, socket: Socket }) {
        this.io = param.io;
        this.roomId = param.roomId;
        this.playerName = param.playerName;
        this.action = param.action;
        this.socket = param.socket;
        this.store = param.io.adapter;
        this.emitter = new Emitter(this.io, this.roomId);
        this.gameLoopEvents = new Map();
    }

    async initialize(): Promise<boolean> {

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
                return true;
            } else {
                console.info(`[ERROR] Room ${this.roomId} does not exists, please create the room first`);
                return false;
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
            this.initLoopEvents()
            return true;
        }

        return false;
    }

    playerJoinedLobby() {
        console.info(`[SHOWALLPLAYERS] Client ${this.socket.id} ${this.store.clients.length}`);

        this.emitAllPlayers(this.store.clients);
        this.emitter.emit('player-joined-lobby', {playerJoined: this.store.clients.find((me: Player) => me.id === this.socket.id)})
    }

    isReady() {
        this.socket.on('on-ready', this._onReadyHandler.bind(this))
        this.socket.on('on-player-hint-submit', (data: { hint: string }) => {
            const {gameState} = this.store;
            const {turns, currentTurn} = gameState.rounds[gameState.currentRound];
            const {hints} = turns[currentTurn];
            hints.push({
                hint: data.hint,
                player: this.store.clients.find((c: Player) => c.id === this.socket.id).id,
                duplicate: false
            })
            const hintersSoFar = hints.map((hint: Hint) => hint.player);
            const allHintersHinted = this.store.clients.length === 3 ? hintersSoFar.length === 4 : this.store.clients.filter((client: Player) => !client.isGuessing).every((client: Player) => hintersSoFar.includes(client.id))
            console.info(`[INFO] Submitting hint of client ${this.socket.id}`);
            if (allHintersHinted) {
                this._clearTimeouts()
                this.transition();
            }
        })
        this.socket.on('on-player-guess-submit', (data: { guess: string, skip: boolean }) => {
            const {gameState}: { gameState: GameState } = this.store;
            const {rounds, currentRound} = gameState;
            const round: Round = rounds[currentRound]
            const turn: Turn = round.turns[round.currentTurn]
            turn.guess = data.guess;
            turn.skip = data.skip;
            console.info(`[INFO] Submitting guess, client ${this.socket.id}`);

            this._clearTimeouts()
            this.transition()
        })

        this.socket.on("toggle-hint-as-duplicate", (data: { hintId: number }) => {
            const {gameState}: { gameState: GameState } = this.store;
            const {rounds, currentRound} = gameState;
            const round: Round = rounds[currentRound]
            const turn: Turn = round.turns[round.currentTurn]
            turn.hints[data.hintId].duplicate = !turn.hints[data.hintId].duplicate;
            this.emitter.emit('turn-hints', {hints: turn.hints, currentRound, currentTurn: round.currentTurn})
        })

        this.socket.on("dedupe-submit", () => this.transition())
    }

    onDisconnect() {
        this.socket.on("disconnect", () => {
            // remove from clients
            console.info(`[DISCONNECT] Client ${this.socket.id} Disconnected from ${this.roomId}`);
            const disconnectedPlayer: Player = this.store.clients.find((client: Player) => client.id === this.socket.id)
            this.store.clients = this.store.clients.filter((client: Player) => client.id !== this.socket.id)
            // when all players disconnected

            if (this.store.clients.length < 2) {
                this._clearTimeouts();
                console.info(`[GAME OVER] All players disconnected from ${this.roomId}`);
                this.gameOver()
                // TODO: at 2 players, one disconnects, then it still starts a newTurn
                return;
            }
            if (disconnectedPlayer) this._emitPlayerDisconnected(disconnectedPlayer)
            if (disconnectedPlayer.isAdmin) {
                this._appointNewAdmin(this.store.clients)
                this.emitAllPlayers(this.store.clients);
            }
            if (disconnectedPlayer.isGuessing) this._appointNewGuesser()
        })
    }

    _appointNewAdmin(clients: Player[]) {
        const newAdminIndex = (Math.abs(clients.findIndex(p => p.isGuessing) - 1)) % clients.length;
        clients[newAdminIndex].isAdmin = true;
    }

    _appointNewGuesser() {

    }

    showGameState() {
        this.emitter.emit('show-game-state', {gameState: this.store.gameState})
    }

    _clearTimeouts() {
        clearTimeout(this.store.countDownTimeout)
        clearInterval(this.store.countDownInterval)
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
        this.emitter.emit('player-ready-change', {id: client.id, isReady: client.isReady})
    }

    resetGameState() {
        const config = new GameConfig(
            2,
            6_000,
            6_000,
            10_000,
            2
        )
        this.store.gameState = new GameState(config)
    }

    _emitStartGame(inLobby: boolean) {
        this.emitter.emit('start-game', {inLobby})
    }

    startGame() {
        this.resetGameState()
        const {gameState} = this.store;

        // move to game from lobby
        gameState.inLobby = false;
        this._emitStartGame(this.store.gameState.inLobby)

        console.info(`[START] All players ready, Game starts in ${this.roomId} room`);
        this.startNewTurn()
    }

    public async startNewTurn() {
        await this.playNewTurn();
        this._isGameOver() ? await this.gameOver() : await this.startNewTurn()
    }

    private async gameOver() {
        const gameOver = new GameOver(this.emitter);
        this._clearTimeouts();
        await gameOver.handle(this.store);
    }

    private transition() {
        // A reference of this is pointing to a Promise resolve
    }

    private async playNewTurn() {
        for (const event of this.gameLoopEvents.values()) {
            this._clearTimeouts();
            await event.handle(this.store);
        }
    }

    _isGameOver(): boolean {
        const {currentRound, gameConfig, rounds} = this.store.gameState;
        const round: Round = rounds[currentRound];

        return gameConfig.maxRounds <= currentRound && gameConfig.maxTurn <= round.currentTurn;
    }

    _emitPlayerDisconnected(disconnectedPlayer: Player) {
        this.emitter.emit('disconnected', {disconnectedPlayer})
    }

    emitAllPlayers(clients: Player[]) {
        this.emitter.emit('show-all-players', {players: clients})
    }

    private initLoopEvents() {
        this.gameLoopEvents = new Map<GameEventType, GameEvent>([
            ['startNewTurn', new StartNewTurn(this.roomId, this.emitter)],
            ['hintCountDown', new Countdown(this.emitter, this.store.gameState.gameConfig.hintTimeout / 1000, this.transition)],
            ['hintToDedupe', new HintToDedupe(this.emitter)],
            ['dedupeCountDown', new Countdown(this.emitter, this.store.gameState.gameConfig.dedupeTimeout / 1000, this.transition)],
            ['dedupeToGuess', new DedupeToGuess(this.emitter)],
            ['guessCountDown', new Countdown(this.emitter, this.store.gameState.gameConfig.guessTimeout / 1000, this.transition)],
            ['guessToNewTurn', new GuessToNewTurn(this.emitter)]])
    }
}

module.exports = {
    Room2, Turn, Round, GameConfig
};