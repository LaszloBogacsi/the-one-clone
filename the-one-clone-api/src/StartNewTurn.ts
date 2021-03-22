import {GameEvent} from "./GameEvent";
import {WordRepository} from "./Room2";
import {Emitter} from "./Emitter";
import {GameStore} from "./GameStore";
import {Player, PlayerRole} from "./Player";
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
            clients.filter((client: Player) => client.role === PlayerRole.GUESSER).forEach(client => client.role = PlayerRole.HINTER);
            const guesserId = (round.currentTurn + 1) % clients.length;
            if (clients[guesserId].role === PlayerRole.ADMIN_HINTER) {
                const newAdminIndex = (Math.abs(guesserId - 1)) % clients.length;
                clients[newAdminIndex].role = PlayerRole.ADMIN_HINTER;
                clients[guesserId].role = PlayerRole.HINTER; // TODO: this is a workaround either create a new emit event or get the frontend to use the role too.
                this.emitAllPlayers(clients);
            }
            clients[guesserId].role = PlayerRole.GUESSER;
            const guesser: Player = clients[guesserId];
            this.emitRoleGeneral(guesser);
            console.info(`[Roles] announcing guesser is ${guesser.playerName}, in ${this.roomId} room`);
        }

        const timedActions: { callable: CallableFunction, delayMs: number }[] = [
            {callable: announceRoles, delayMs: timingFor("announceRoles")},
            {callable: this.announceNewTurn.bind(this, store), delayMs: timingFor("announceNewTurn")},
            {callable: this.startNewTurn.bind(this, resolve), delayMs: timingFor("startNewTurn")},

        ]
        timedActions.forEach(this.startTimedAction.bind(this))
    }

    private startTimedAction(timedAction: { callable: CallableFunction, delayMs: number }) {
        const timeout = setTimeout(timedAction.callable, timedAction.delayMs);
        this.timeouts.push(timeout);
    }

    private announceNewTurn(store: GameStore): void {
        const {gameState}: { gameState: GameState } = store;
        const {rounds, currentRound} = gameState;
        const turn = new Turn(this.wordRepository.getRandomWord());
        const round = rounds[currentRound];

        const newRound = {...round, turns: [...round.turns, turn], currentTurn: round.currentTurn + 1}
        rounds[currentRound] = newRound;
        this.emitNewTurn(turn, currentRound, newRound.currentTurn)
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
        this.emitter.emit('player-roles', {guesser: {id: guesser.id}})
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

    private emitAllPlayers(clients: Player[]) {
        this.emitter.emit('show-all-players', {players: clients})
    }

}