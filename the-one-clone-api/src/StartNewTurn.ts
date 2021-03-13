import {GameEvent} from "./GameEvent";
import {WordRepository} from "./Room2";
import {Emitter} from "./Emitter";
import {GameStore} from "./GameStore";
import Timeout = NodeJS.Timeout;
import {Player} from "./Player";
import {Turn} from "./Turn";
import {Round} from "./Round";
import {GameState} from "./GameState";

export class StartNewTurn implements GameEvent {
    private readonly timeouts: number[] = []

    constructor(private readonly roomId: string,
                private readonly emitter: Emitter,
                private readonly wordRepository: WordRepository) {
    }

    public cancel(): void {
        this.timeouts.forEach(clearTimeout);
    };

    async handle(store: GameStore): Promise<void> {
        return new Promise(resolve => this.prepAndStartNewTurn(store, resolve));
    }

    private getEventTiming(currentRound: number): (event: string) => number {
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
            return currentRound > -1 ? timings.get(event) || interval : timings2.get(event) || interval;
        }
    }

    private prepAndStartNewTurn(store: GameStore, resolve: (value?: void) => void): void {
        const {clients, gameState} = store;
        const {rounds, currentRound, gameConfig} = gameState;
        const round: Round = rounds[currentRound];
        const timingFor = this.getEventTiming(currentRound);
        if (currentRound === -1 || gameConfig.maxTurn <= round.currentTurn) {
            const timedActions: { callable: CallableFunction, delayMs: number }[] = [
                {callable: this.roundEnd.bind(this, store), delayMs: timingFor("roundEnd")},
                {callable: this.startNewRound.bind(this, store), delayMs: timingFor("newRound")}
            ]
            if (currentRound > -1) {
                this.startTimedAction(timedActions[0])
            }
            this.startTimedAction(timedActions[1])
        }

        const announceRoles = (): void => {
            const {rounds, currentRound} = gameState;
            const round: Round = rounds[currentRound];
            clients.forEach((client: Player) => client.isGuessing = false);
            const guesserId = (round.currentTurn + 1) % clients.length;
            clients[guesserId].isGuessing = true;
            const guesser: Player = clients[guesserId];
            this.emitRoleGeneral(guesser);
            console.info(`[Roles] announcing guesser is ${guesser.playerName}, in ${this.roomId} room`);
        }

        const timedActions: { callable: CallableFunction, delayMs: number }[] = [
            {callable: announceRoles, delayMs: timingFor("announceRoles")},
            {callable: this.announceNewTurn.bind(this, store), delayMs: timingFor("announceNewTurn")},
            {callable: this.startNewTurn.bind(this, resolve), delayMs: timingFor("startNewTurn")},

        ]
        timedActions.forEach(this.startTimedAction)
    }

    private startTimedAction(timedAction: { callable: CallableFunction, delayMs: number }) {
        const timeout = setTimeout(timedAction.callable, timedAction.delayMs);
        this.timeouts.push(timeout);
    }

    private announceNewTurn(store: GameStore): void {
        const {gameState}: { gameState: GameState } = store;
        const {rounds, currentRound} = gameState;
        const turn = new Turn(this.wordRepository.getRandomWord());
        let round = rounds[currentRound];

        round = {...round, turns: [...round.turns, turn], currentTurn: round.currentTurn + 1}
        this.emitNewTurn(turn, currentRound, round.currentTurn)
    }

    private startNewTurn(resolve: (value?: void) => void) {
        console.info(`[NEWTURN] New Turn starting, in ${this.roomId} room`);
        this.emitStartNewTurn();
        resolve();
    }

    private roundEnd({gameState: {currentRound}}: GameStore): void {
        this.emitRoundEnd(currentRound);
    }

    private startNewRound(store: GameStore): void {
        const round = new Round(store.gameState.gameConfig.maxTurn);
        const {addRound} = store.gameState;
        addRound.call(store.gameState, round)
        this.emitRound(round, store.gameState.currentRound)
        console.info(`[NEWROUND] New Round starting, in ${this.roomId} room`);
    }

    private emitRoleGeneral(guesser: Player): void {
        this.emitter.emit('player-roles', {guesser: {id: guesser.id, name: guesser.playerName}})
    }

    private emitRoundEnd(currentRound: number): void {
        this.emitter.emit('end-round', {currentRound})
    }

    private emitRound(round: Round, currentRound: number): void {
        this.emitter.emit('start-round', {round, currentRound})
    }

    private emitNewTurn(turn: Turn, currentRound: any, currentTurn: number): void {
        this.emitter.emit('new-turn', {turn, currentRound, currentTurn})
    }

    private emitStartNewTurn(): void {
        this.emitter.emit('start-turn', {message: "start turn"})
    }

}