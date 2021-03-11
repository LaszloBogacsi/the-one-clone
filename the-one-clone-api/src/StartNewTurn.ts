import {GameEvent} from "./GameEvent";
import {GameState, Player, Round, Turn, WordRepository} from "./Room2";
import {Emitter} from "./Emitter";
import {GameStore} from "./GameStore";

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

    private getEventTiming(currentRound: number): (event: string) => number | undefined {
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

    private prepAndStartNewTurn(store: GameStore, resolve: (value?: void) => void): void {
        const {clients, gameState} = store;
        const {rounds, currentRound, gameConfig} = gameState;
        const round: Round = rounds[currentRound];
        const timingFor = this.getEventTiming(currentRound);
        if (currentRound === -1 || gameConfig.maxTurn <= round.currentTurn) {
            if (currentRound > -1) {
                this.timeouts.push(setTimeout(this.roundEnd.bind(this, store), timingFor("roundEnd")));
            }
            this.timeouts.push(setTimeout(this.startNewRound.bind(this, store), timingFor("newRound")));
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

        this.timeouts.push(setTimeout(announceRoles, timingFor("announceRoles")));
        this.timeouts.push(setTimeout(this.announceNewTurn.bind(this, store), timingFor("announceNewTurn")));
        this.timeouts.push(setTimeout(this.startNewTurn.bind(this, store, resolve), timingFor("startNewTurn")));
    }

    private announceNewTurn(store: GameStore): void {
        const {gameState}: { gameState: GameState } = store;
        const {rounds, currentRound} = gameState;
        const turn = new Turn(this.wordRepository.getRandomWord());
        const round = rounds[currentRound];
        round.addTurn(turn)
        this.emitNewTurn(turn, currentRound, round.currentTurn)
    }

    private startNewTurn(store: GameStore, resolve: (value?: void) => void) {
        console.info(`[NEWTURN] New Turn starting, in ${this.roomId} room`);
        this.emitStartNewTurn();
        resolve();
    }

    private roundEnd({gameState: {currentRound}}: GameStore): void {
        this.emitRoundEnd(currentRound);
    }

    private startNewRound(store: GameStore): void {
        const round = new Round();
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