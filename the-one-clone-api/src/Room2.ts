import {Namespace, Socket} from "socket.io";
import {StartNewTurn} from "./StartNewTurn";
import {Emitter} from "./Emitter";
import {HintToDedupe} from "./HintToDedupe";
import {DedupeToGuess} from "./DedupeToGuess";
import {GuessToNewTurn} from "./GuessToNewTurn";
import {GameOver} from "./GameOver";
import {GameEvent} from "./GameEvent";
import {Countdown} from "./Countdown";
import {Player, PlayerRole} from "./Player";
import {Turn} from "./Turn";
import {Hint} from "./Hint";
import {Round} from "./Round";
import {GameConfig} from "./GameConfig";
import {GameState} from "./GameState";

type GameEventType = 'startNewTurn' | 'hintToDedupe' | 'dedupeToGuess' | 'guessToNewTurn' | 'hintCountDown' | 'dedupeCountDown' | 'guessCountDown'

export interface WordRepository {
    getRandomWord: () => string
}

type RoomAction = "join" | "create"

export class Room2 {
    private io: Namespace;
    private roomId: string
    private playerName: string
    private action: RoomAction
    private socket: Socket
    private store: any
    private readonly emitter: Emitter;
    private wordRepository: WordRepository;
    private readonly gameConfig: GameConfig;

    constructor(param: { io: Namespace, roomId: string, playerName: string, action: RoomAction, socket: Socket, wordRepository: WordRepository }) {
        this.io = param.io;
        this.roomId = param.roomId;
        this.playerName = param.playerName;
        this.action = param.action;
        this.socket = param.socket;
        this.gameConfig = new GameConfig(
            5,
            60_000,
            60_000,
            20_000,
            12
        )
        this.store = param.io.adapter;
        this.emitter = new Emitter(this.io, this.roomId);
        // this.gameLoopEvents = new Map();
        this.wordRepository = param.wordRepository;

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
                    role: PlayerRole.HINTER
                })
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
                role: PlayerRole.ADMIN_HINTER
            }]
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
        this.socket.on('on-player-hint-submit', this._onPlayerHintSubmit.bind(this))
        this.socket.on('on-player-guess-submit', (data: { guess: string, skip: boolean }) => {
            const {gameState}: { gameState: GameState } = this.store;
            const {rounds, currentRound} = gameState;
            const round: Round = rounds[currentRound]
            const turn: Turn = round.turns[round.currentTurn]
            turn.guess = data.guess;
            turn.skip = data.skip;
            console.info(`[INFO] Submitting guess, client ${this.socket.id}`);

            this._clearAllTimeouts()
            this.store.gameLoopEvents.get("guessCountDown")!.cancel()
        })
        this.socket.on("toggle-hint-as-duplicate", (data: { hintId: number }) => {
            const {gameState}: { gameState: GameState } = this.store;
            const {rounds, currentRound} = gameState;
            const round: Round = rounds[currentRound]
            const turn: Turn = round.turns[round.currentTurn]
            turn.hints[data.hintId].duplicate = !turn.hints[data.hintId].duplicate;
            this.emitter.emit('turn-hints', {hints: turn.hints, currentRound, currentTurn: round.currentTurn})
        })
        this.socket.on("dedupe-submit", () => this.store.gameLoopEvents.get("dedupeCountDown")!.cancel())
        this.socket.on("set-maxRound", (data: {newValue: number}) => {
            this.gameConfig.maxRounds = data.newValue;
            this.emitter.emit('game-settings-maxRound', {maxRound: this.gameConfig.maxRounds})
        })
        this.socket.on("set-hintTimeout", (data: {newValue: number}) => {
            this.gameConfig.hintTimeout = data.newValue;
            this.emitter.emit('game-settings-hintTimeout', {hintTimeout: this.gameConfig.hintTimeout})
        })
        this.socket.on("set-guessTimeout", (data: {newValue: number}) => {
            this.gameConfig.guessTimeout = data.newValue;
            this.emitter.emit('game-settings-guessTimeout', {guessTimeout: this.gameConfig.guessTimeout})
        })
    }

    _onPlayerHintSubmit (data: { hint: string }) {
            const {gameState} = this.store;
            const {turns, currentTurn} = gameState.rounds[gameState.currentRound];
            const {hints} = turns[currentTurn];
            hints.push({
                hint: data.hint,
                player: this.store.clients.find((c: Player) => c.id === this.socket.id)!.id,
                duplicate: false
            })
            const hintersSoFar = hints.map((hint: Hint) => hint.player);
            const allHintersHinted = this.store.clients.length <= 3 ? hintersSoFar.length % 2 === 0 : this.store.clients.filter((client: Player) => client.role !== PlayerRole.GUESSER).every((client: Player) => hintersSoFar.includes(client.id))
            console.info(`[INFO] Submitting hint of client ${this.socket.id}`);
            if (allHintersHinted) {
                this._clearAllTimeouts()
                this.store.gameLoopEvents.get("hintCountDown")!.cancel()
            }
    }

    onDisconnect() {
        this.socket.on("disconnect",  () => {
            // remove from clients
            console.info(`[DISCONNECT] Client ${this.socket.id} Disconnected from ${this.roomId}`);
            const disconnectedPlayer: Player | undefined = this.store.clients.find((client: Player) => client.id === this.socket.id);
            this.store.clients = this.store.clients.filter((client: Player) => client.id !== this.socket.id)
            // when all players disconnected

            if (this.store.clients.length < 2) {
                this._clearAllTimeouts();
                console.info(`[GAME OVER] All players disconnected from ${this.roomId}`);
                this.gameOver();
                return;
            }
            if (disconnectedPlayer) this._emitPlayerDisconnected(disconnectedPlayer)
            if (disconnectedPlayer && disconnectedPlayer.role === PlayerRole.ADMIN_HINTER) {
                this._appointNewAdmin(this.store.clients)
                this.emitAllPlayers(this.store.clients);
            }
            if (disconnectedPlayer && disconnectedPlayer.role === PlayerRole.GUESSER) this.appointNewGuesser()
        })
    }

    _appointNewAdmin(clients: Player[]) {
        const newAdminIndex = (Math.abs(clients.findIndex(p => p.role === PlayerRole.GUESSER) - 1)) % clients.length;
        clients[newAdminIndex].role = PlayerRole.ADMIN_HINTER;
    }

    private appointNewGuesser() {
        this._clearAllTimeouts();
        this.startNewTurn();
    }

    showGameState() {
        this.emitter.emit('show-game-state', {gameState: this.store.gameState})
    }

    _clearAllTimeouts() {
        console.info(`[INFO] Clearing timeouts`);
        for (const event of this.store.gameLoopEvents.values()) {
            this._clearEventTimeouts(event);
        }
    }

    _clearEventTimeouts(event: GameEvent): void {
        event.cancel();
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
        this.store.gameState = new GameState(this.gameConfig)
    }

    private startGame() {
        this.resetGameState()
        const {gameState} = this.store;
        gameState.inLobby = false;
        this._emitStartGame(gameState.inLobby)
        console.info(`[START] All players ready, Game starts in ${this.roomId} room`);
        this.startNewTurn()
    }

    _emitStartGame(inLobby: boolean) {
        this.emitter.emit('start-game', {inLobby})
    }

    private async startNewTurn() {
        await this.playNewTurn();
        this._isGameOver() ? await this.gameOver() : await this.startNewTurn()
    }

    private async gameOver() {
        const gameOver = new GameOver(this.emitter);
        this._clearAllTimeouts();
        await gameOver.handle(this.store);
        gameOver.cancel();
    }

    transition() {
        console.log("[INFO] Transitioning...")
        // A reference of this is pointing to a Promise resolve
    }

    private async playNewTurn() {
        for (const event of this.store.gameLoopEvents.values()) {
            this._clearAllTimeouts();
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
        this.store.gameLoopEvents = new Map<GameEventType, GameEvent>([
            ['startNewTurn', new StartNewTurn(this.roomId, this.emitter, this.wordRepository)],
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