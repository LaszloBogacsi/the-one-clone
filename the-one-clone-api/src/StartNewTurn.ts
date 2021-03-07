import {GameEvent} from "./GameEvent";
import {GameState, Player, Round, Turn} from "./Room2";
import {Emitter} from "./Emitter";
import {GameStore} from "./GameStore";
import Timeout = NodeJS.Timeout;

export class StartNewTurn implements GameEvent {

    constructor(private readonly roomId: string, private readonly emitter: Emitter) {
    }

    async handle(store: GameStore): Promise<void> {
        return new Promise(resolve => this._prepAndStartNewTurn(store, resolve));
    }

    _getEventTiming(currentRound: number) {
        return function (event: string) {
            const interval = 3000;
            const timings: Map<string, number> = new Map([
                ["newRound", interval],
                ["announceRoles", interval * 2],
                ["announceNewTurn", interval * 3],
                ["startNewTurn", interval * 4]
            ])
            const timings2: Map<string, number> = new Map([
                ["roundEnd", interval],
                ["newRound", interval * 2],
                ["announceRoles", interval * 3],
                ["announceNewTurn", interval * 4],
                ["startNewTurn", interval * 5]
            ])
            return currentRound > -1 ? timings.get(event) : timings2.get(event);
        }
    }

    _prepAndStartNewTurn(store: GameStore, resolve: (value?: void) => void) {
        const {clients, gameState} = store;
        const {rounds, currentRound, gameConfig} = gameState;
        const round: Round = rounds[currentRound];
        const timingFor = this._getEventTiming(currentRound);
        if (currentRound === -1 || gameConfig.maxTurn <= round.currentTurn) {
            if (currentRound > -1) {
                setTimeout(this._roundEnd.bind(this, store), timingFor("roundEnd"))
            }
            setTimeout(this._startNewRound.bind(this, store), timingFor("newRound"))
        }

        const announceRoles = () => {
            const {rounds, currentRound} = gameState;
            const round: Round = rounds[currentRound];
            clients.forEach((client: Player) => client.isGuessing = false)
            const guesserId = (round.currentTurn + 1) % clients.length;
            clients[guesserId].isGuessing = true
            const guesser: Player = clients[guesserId];
            this._emitRoleGeneral(guesser)
            console.info(`[Roles] announcing guesser is ${guesser.playerName}, in ${this.roomId} room`);
        }

        setTimeout(announceRoles, timingFor("announceRoles"))
        setTimeout(this._announceNewTurn.bind(this, store), timingFor("announceNewTurn"))
        setTimeout(this._startNewTurn.bind(this, store, resolve), timingFor("startNewTurn"))
    }

    _announceNewTurn(store: GameStore) {
        const {gameState}: { gameState: GameState } = store;
        const {rounds, currentRound} = gameState;
        const turn = new Turn(this._getSecretWord());
        const round = rounds[currentRound];
        round.addTurn(turn)
        this._emitNewTurn(turn, currentRound, round.currentTurn)
    }

    _startNewTurn(store: GameStore, resolve: (value?: void) => void) {
        console.info(`[NEWTURN] New Turn starting, in ${this.roomId} room`);
        this._emitStartNewTurn()
        resolve();
    }

    _roundEnd({gameState: {currentRound}}: GameStore) {
        this._emitRoundEnd(currentRound)
    }

    _startNewRound({gameState: {addRound, currentRound}}: GameStore) {
        const round = new Round();
        addRound(round)
        this._emitRound(round, currentRound)
        console.info(`[NEWROUND] New Round starting, in ${this.roomId} room`);
    }

    _emitRoleGeneral(guesser: Player) {
        this.emitter.emit('player-roles', {guesser: {id: guesser.id, name: guesser.playerName}})
    }

    _emitRoundEnd(currentRound: number) {
        this.emitter.emit('end-round', {currentRound})
    }

    _emitRound(round: Round, currentRound: number) {
        this.emitter.emit('start-round', {round, currentRound})
    }

    _emitNewTurn(turn: Turn, currentRound: any, currentTurn: number) {
        this.emitter.emit('new-turn', {turn, currentRound, currentTurn})
    }

    _emitStartNewTurn() {
        this.emitter.emit('start-turn', {message: "start turn"})
    }

    // TODO: to repository
    _getSecretWord() {
        const secretWords = ["secret", "words", "guessing"];
        return secretWords[Math.floor(Math.random() * secretWords.length)]
    }
}