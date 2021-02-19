import {Namespace, Socket} from "socket.io";


interface Player {
    id: string
    playerName: string
    isReady: boolean
    isAdmin: boolean
    isGuessing: boolean
}

class Turn {
    public readonly secretWord: string
    public hints: Hint[] = []
    public reveal = false
    public guess = ""
    public result: string | undefined;
    public deduplication = false;

    constructor(chosenWord: string) {
        this.secretWord = chosenWord
    }
}

class Hint {
    constructor(public readonly player: Player, public readonly hint: string, public duplicate: boolean) {
    }
}

class Round {
    public turns: Turn[] = []
    public points = 0
    public currentTurn = -1

    constructor() {
    }

    addTurn(turn: Turn) {
        this.turns.push(turn);
        this.currentTurn += 1;
    }

}

class GameConfig {
    constructor(
        public maxRounds: number,
        public hintTimeout: number,
        public guessTimeout: number,
        public dedupeTimeout: number,
        public maxTurn: number) {
    }
}

class GameState {
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
        console.info(`[SHOWALLPLAYERS] Client ${this.socket.id} ${this.store.clients.length}`);

        this.socket.emit('show-all-players', {players: this.store.clients})
        this.io.to(this.roomId).emit('player-joined-lobby', {playerJoined: this.store.clients.find((me: Player) => me.id === this.socket.id)})
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
                this._hintToDedupeTransition()
            }
        })
        this.socket.on('on-player-guess-submit', (data: { guess: string }) => {
            const {gameState}: { gameState: GameState } = this.store;
            const {rounds, currentRound} = gameState;
            const round: Round = rounds[currentRound]
            const turn: Turn = round.turns[round.currentTurn]
            turn.guess = data.guess;
            console.info(`[INFO] Submitting guess, client ${this.socket.id}`);

            this._clearTimeouts()
            this._guessToNewTurnTransition()
        })

        this.socket.on("toggle-hint-as-duplicate", (data: {hintId: number}) => {
            const {gameState}: { gameState: GameState } = this.store;
            const {rounds, currentRound} = gameState;
            const round: Round = rounds[currentRound]
            const turn: Turn = round.turns[round.currentTurn]
            turn.hints[data.hintId].duplicate = !turn.hints[data.hintId].duplicate;
            this._emitHints(turn.hints, currentRound, round.currentTurn)
        })

        this.socket.on("dedupe-submit", () => this._dedupeToGuessTransition())
    }

    onDisconnect() {
        this.socket.on("disconnect", () => {
            // remove from clients
            console.info(`[DISCONNECT] Client ${this.socket.id} Disconnected from ${this.roomId}`);
            const disconnectedPlayer: Player = this.store.clients.find((client: Player) => client.id === this.socket.id)
            this.store.clients = this.store.clients.filter((client: Player) => client.id !== this.socket.id)
            // when all players disconnected
            if (!this.store.clients.length) {
                this._clearTimeouts();
                console.info(`[GAME OVER] All players disconnected from ${this.roomId}`);
                this._gameOver()
            }
            if (disconnectedPlayer) this._emitPlayerDisconnected(disconnectedPlayer)
        })
    }

    showGameState() {
        this.io.to(this.roomId).emit('show-game-state', {gameState: this.store.gameState})
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
        this.io.to(this.roomId).emit('player-ready-change', {id: client.id, isReady: client.isReady})
    }

    _getSecretWord() {
        const secretWords = ["secret", "words", "guessing"];
        return secretWords[Math.floor(Math.random() * secretWords.length)]
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
        this.io.to(this.roomId).emit('start-game', {inLobby})
    }

    _emitRound(round: Round, currentRound: number) {
        this.io.to(this.roomId).emit('start-round', {round, currentRound})
    }

    _emitRoleGeneral(guesser: Player) {
        this.io.to(this.roomId).emit('player-roles', {guesser: {id: guesser.id, name: guesser.playerName}})
    }

    startGame() {
        this.resetGameState()
        const {gameState} = this.store;

        // move to game from lobby
        gameState.inLobby = false;
        this._emitStartGame(this.store.gameState.inLobby)
        console.info(`[StartGame] Moving from lobby to game, in ${this.roomId} room`);

        this._prepAndStartNewTurn();

        console.info(`[CREATE] All players ready, Game starts in ${this.roomId} room`);
    }

    _getEventTiming(currentRound: number) {
        return function (event: string) {
            const interval = 3000;
            const timings: Map<string, number> = new Map([["newRound", interval], ["announceRoles", interval * 2], ["announceNewTurn", interval * 3], ["startNewTurn", interval * 4]])
            const timings2: Map<string, number> = new Map([["roundEnd", interval], ["newRound", interval * 2], ["announceRoles",  interval * 3], ["announceNewTurn",  interval * 4], ["startNewTurn",  interval * 5]])
            return currentRound > -1 ? timings.get(event) : timings2.get(event);
        }
    }

    _prepAndStartNewTurn() {
        const {clients, gameState} = this.store;
        const {rounds, currentRound, gameConfig} = gameState;
        const round: Round = rounds[currentRound];
        const timingFor = this._getEventTiming(currentRound);
        // start new round and announce roles
        if (currentRound === -1 || gameConfig.maxTurn <= round.currentTurn) {
            if (currentRound > -1) {
                setTimeout(this._roundEnd.bind(this), timingFor("roundEnd"))
            }
            setTimeout(this._startNewRound.bind(this), timingFor("newRound"))
        }

        const announceRoles = () => {
            const {rounds, currentRound} = this.store.gameState;
            const round: Round = rounds[currentRound];
            clients.forEach((client: Player) => client.isGuessing = false)
            const guesserId = (round.currentTurn + 1) % clients.length;
            clients[guesserId].isGuessing = true
            const guesser: Player = clients[guesserId];
            this._emitRoleGeneral(guesser)
            console.info(`[Roles] announcing guesser is ${guesser.playerName}, in ${this.roomId} room`);
        }

        setTimeout(announceRoles, timingFor("announceRoles"))
        setTimeout(this._announceNewTurn.bind(this), timingFor("announceNewTurn"))
        setTimeout(this._startNewTurn.bind(this), timingFor("startNewTurn"))
    }

    _roundEnd() {
        this._emitRoundEnd(this.store.gameState.currentRound)
    }

    _emitRoundEnd(currentRound: number) {
        this.io.to(this.roomId).emit('end-round', {currentRound})
    }
    _startNewRound() {
        const round = new Round();
        this.store.gameState.addRound(round)
        this._emitRound(round, this.store.gameState.currentRound)
        console.info(`[NEWROUND] New Round starting, in ${this.roomId} room`);
    }

    _announceNewTurn() {
        const {gameState}: { gameState: GameState } = this.store;
        const {rounds, currentRound} = gameState;
        const turn = new Turn(this._getSecretWord());
        const round = rounds[currentRound];
        round.addTurn(turn)
        this._emitNewTurn(turn, currentRound, round.currentTurn)
    }

    _startNewTurn() {
        console.info(`[NEWTURN] New Turn starting, in ${this.roomId} room`);
        this._emitStartNewTurn()
        this._startCountDown(this.store.gameState.gameConfig.hintTimeout / 1000, this._hintToDedupeTransition.bind(this))
    }

    _emitNewTurn(turn: Turn, currentRound: any, currentTurn: number) {
        this.io.to(this.roomId).emit('new-turn', {turn, currentRound, currentTurn})
    }

    _emitStartNewTurn() {
        this.io.to(this.roomId).emit('start-turn', {message: "start turn"})
    }

    _startCountDown(delay: number, transition: () => void) {
        this.store.countDownTimeout = setTimeout(() => {
            transition()
        }, delay * 1000)

        let countdown = delay;
        this.io.to(this.roomId).emit('countdown', {countdown})
        this.store.countDownInterval = setInterval(() => {
            countdown -= 1
            this.io.to(this.roomId).emit('countdown', {countdown})
        }, 1000)
    }

    _hintToDedupeTransition() {
        this._clearTimeouts()
        this._hintEnd()
        this._markDuplicatesForCurrentTurn()
        this._deduplicate()
    }

    _deduplicate() {
        setTimeout(() => {
            this._revealHintsToHinters();
            this._announceDeduplication();
        })
        setTimeout(() => {
            this._startDeduplication();
            this._startCountDown(this.store.gameState.gameConfig.dedupeTimeout / 1000, this._dedupeToGuessTransition.bind(this));
        }, 2000)


    }

    _dedupeToGuessTransition() {
        this._clearTimeouts()
        this._revealHintsToGuesser()
        this._startNewGuess()
    }

    _hintEnd() {
        clearInterval(this.store.countDownInterval)
        this._emitHintEnd()
    }

    _emitHintEnd() {
        this.io.to(this.roomId).emit('end-hint', {message: "hint end"})
    }

    _announceDeduplication() {
        this._emitAnnounceDeduplication()
    }

    _emitAnnounceDeduplication() {
        this.io.to(this.roomId).emit('announce-deduplication', {message: "deduplication start"})
    }

    _startDeduplication() {
        const {gameState}: { gameState: GameState } = this.store;
        const {rounds, currentRound} = gameState;
        const round: Round = rounds[currentRound]
        const turn: Turn = round.turns[round.currentTurn]
        turn.deduplication = true;
        this._emitStartDeduplication(turn.deduplication, currentRound, round.currentTurn)
    }

    _emitStartDeduplication(deduplication: boolean, currentRound: number, currentTurn: number) {
        this.io.to(this.roomId).emit('start-deduplication', {deduplication, currentRound, currentTurn})
    }

    _revealHints() {
        const {gameState}: { gameState: GameState } = this.store;
        const {rounds, currentRound} = gameState;
        const round: Round = rounds[currentRound]
        const turn: Turn = round.turns[round.currentTurn]
        this._emitHints(turn.hints, currentRound, round.currentTurn)
        turn.reveal = true
        this._emitReveal(turn.reveal, currentRound, round.currentTurn)
    }

    _emitHints(hints: Hint[], currentRound: number, currentTurn: number) {
        this.io.to(this.roomId).emit('turn-hints', {hints, currentRound, currentTurn})
    }

    _emitReveal(reveal: boolean, currentRound: number, currentTurn: number) {
        this.io.to(this.roomId).emit('turn-hints-reveal', {reveal, currentRound, currentTurn})
    }

    _revealHintsToHinters() {
        const {gameState}: { gameState: GameState } = this.store;
        const {rounds, currentRound} = gameState;
        const round: Round = rounds[currentRound]
        const turn: Turn = round.turns[round.currentTurn]
        this._emitHintsToHinters(turn.hints, currentRound, round.currentTurn)
        turn.reveal = true
        this._emitRevealToHinters(turn.reveal, currentRound, round.currentTurn)
    }

    _emitHintsToHinters(hints: Hint[], currentRound: number, currentTurn: number) {
        this.store.clients.filter((client: Player) => !client.isGuessing).forEach((client: Player) => {
            console.log("emitting to " + client.playerName);
            if (this.io.sockets.get(client.id)) this.io.sockets.get(client.id)!.emit("turn-hints", {hints, currentRound, currentTurn})
        })
    }

    _emitRevealToHinters(reveal: boolean, currentRound: number, currentTurn: number) {
        this.store.clients.filter((client: Player) => !client.isGuessing).forEach((client: Player) => {
            if (this.io.sockets.get(client.id)) this.io.sockets.get(client.id)!.emit('turn-hints-reveal', {reveal, currentRound, currentTurn})
        })
    }

    _revealHintsToGuesser() {
        const {gameState}: { gameState: GameState } = this.store;
        const {rounds, currentRound} = gameState;
        const round: Round = rounds[currentRound]
        const turn: Turn = round.turns[round.currentTurn]

        const sortByDuplicatesLast = (a: Hint, b: Hint) => +a - +b;

        this._emitHintsToGuesser(turn.hints.map(hint => hint.duplicate ? {...hint, hint: "Duplicate"} : hint).sort(sortByDuplicatesLast), currentRound, round.currentTurn)
        turn.reveal = true
        this._emitRevealToGuesser(turn.reveal, currentRound, round.currentTurn)
    }

    _emitHintsToGuesser(hints: Hint[], currentRound: number, currentTurn: number) {
        this.store.clients.filter((client: Player) => client.isGuessing).forEach((client: Player) => {
            console.log("emitting to " + client.playerName);
            if (this.io.sockets.get(client.id)) this.io.sockets.get(client.id)!.emit("turn-hints", {hints, currentRound, currentTurn})
        })
    }

    _emitRevealToGuesser(reveal: boolean, currentRound: number, currentTurn: number) {
        this.store.clients.filter((client: Player) => client.isGuessing).forEach((client: Player) => {
            if (this.io.sockets.get(client.id)) this.io.sockets.get(client.id)!.emit('turn-hints-reveal', {reveal, currentRound, currentTurn})
        })
    }

    _markDuplicatesForCurrentTurn() {
        const {gameState}: { gameState: GameState } = this.store;
        const {rounds, currentRound} = gameState;
        const round: Round = rounds[currentRound]
        const turn: Turn = round.turns[round.currentTurn]
        this._markDuplicates(turn.hints)
    }

    _markDuplicates(hints: Hint[]) {
        hints.sort((a, b) => a.hint.localeCompare(b.hint)).forEach((hint, index, arr) => {
            if (index < arr.length - 1 && hint.hint.toUpperCase() === arr[index + 1].hint.toUpperCase()) {
                hint.duplicate = true;
                arr[index + 1].duplicate = true
            }
        })
    }

    _startNewGuess() {
        this._startCountDown(this.store.gameState.gameConfig.guessTimeout / 1000, this._guessToNewTurnTransition.bind(this))
    }

    _guessToNewTurnTransition() {
        this._clearTimeouts()
        this._revealTurnResult()
        !this._isGameOver() ? this._prepAndStartNewTurn() : this._gameOver()
    }

    _isGameOver(): boolean {
        const {currentRound, gameConfig, rounds} = this.store.gameState;
        const round: Round = rounds[currentRound]

        return gameConfig.maxRounds <= currentRound && gameConfig.maxTurn <= round.currentTurn;
    }

    _revealTurnResult() {
        const {gameState}: { gameState: GameState } = this.store;
        const {rounds, currentRound, gameConfig} = gameState;
        const round: Round = rounds[currentRound]
        const turn: Turn = round.turns[round.currentTurn]

        const match = turn.guess === turn.secretWord
        if (match) {
            round.points += 1
        } else {
            gameConfig.maxTurn ? round.points = Math.max(0, round.points + 1) : gameConfig.maxTurn -= 1 // TODO: Maybe a round shoud have an effective max turn
        }
        const result = match ? 'success' : 'failure'
        turn.result = result;
        this._emitTurnResults(currentRound, round.currentTurn, round.points, gameConfig.maxTurn, result)
    }

    _emitTurnResults(currentRound: number, currentTurn: number, points: number, maxTurn: number, result: string) {
        this.io.to(this.roomId).emit('turn-result', {currentRound, currentTurn, points, maxTurn, result})
    }

    _emitPlayerDisconnected(disconnectedPlayer: Player) {
        this.io.to(this.roomId).emit('disconnected', {disconnectedPlayer})
    }

    _gameOver() {
        const intervalMs = 2000;
        const timingFor = (event: string) => new Map([["announce", intervalMs], ["transition", intervalMs * 2]]).get(event)
        setTimeout(this._announceGameOver.bind(this), timingFor("announce"))
        setTimeout(this._doGameOver.bind(this), timingFor("transition"));
    }

    _doGameOver() {
        const {clients, gameState}: { clients: Player[], gameState: GameState } = this.store;
        clients.forEach((client: Player) => {
            client.isGuessing = false;
            client.isReady = false;
        })
        this._clearTimeouts()
        gameState.inLobby = true;
        this._emitGameOver(gameState.inLobby);
        this.emitAllPlayers(clients);
        const results = gameState.rounds.map(round => round.points)
        this._emitGameResults(results);
    }

    _announceGameOver() {
      this._emitAnnounceGameOver()
    }

    _emitAnnounceGameOver() {
        this.io.to(this.roomId).emit('game-over-announcement', {gameOver: true})
    }

    _emitGameOver(inLobby: boolean) {
        this.io.to(this.roomId).emit('end-game', {inLobby})
    }

    emitAllPlayers(clients: Player[]) {
        this.io.to(this.roomId).emit('show-all-players', {players: clients})
    }

    _emitGameResults(results: number[]) {
        this.io.to(this.roomId).emit('game-result', {results})
    }
}

module.exports = Room2;

