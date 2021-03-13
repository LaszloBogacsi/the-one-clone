import {GameEvent} from "./GameEvent";
import {GameStore} from "./GameStore";
import {Emitter} from "./Emitter";
import {Player, PlayerRole} from "./Player";
import {Turn} from "./Turn";
import {Hint} from "./Hint";
import {Round} from "./Round";
import {GameState} from "./GameState";

export class HintToDedupe implements GameEvent {
    private readonly timeouts: number[] = []

    constructor(private readonly emitter: Emitter) {
    }

    public cancel(): void {
        this.timeouts.forEach(clearTimeout);
    };

    handle(store: GameStore): Promise<void> {
        this.emitHintEnd();
        this._markDuplicatesForCurrentTurn(store);
        return new Promise(resolve => this.deduplicate(store, resolve));
    }

    _markDuplicatesForCurrentTurn(store: GameStore) {
        const {gameState}: { gameState: GameState } = store;
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

    private static getEventTiming(event: string): number | undefined {
        const interval = 2000;
        const timings: Map<string, number> = new Map([
            ["revealHints", 0],
            ["startDeduplication", interval],
        ])
        return timings.get(event)
    }

    private deduplicate(store: GameStore, resolve: (value?: void) => void): void {

        this.timeouts.push(setTimeout(() => {
            this.revealHintsToHinters(store);
            this.emitAnnounceDeduplication()
        }, HintToDedupe.getEventTiming("revealHints")));
        this.timeouts.push(setTimeout(() => {
            this.startDeduplication(store);
            resolve();
        }, HintToDedupe.getEventTiming("startDeduplication")))
    }

    private revealHintsToHinters(store: GameStore): void {
        const {gameState, clients}: { gameState: GameState, clients: Player[] } = store;
        const {rounds, currentRound} = gameState;
        const round: Round = rounds[currentRound]
        const turn: Turn = round.turns[round.currentTurn]
        const hinters = clients.filter((client: Player) => client.role !== PlayerRole.GUESSER);
        this.emitHintsToHinters(hinters, turn.hints, currentRound, round.currentTurn)
        turn.reveal = true
        this.emitRevealToHinters(hinters, turn.reveal, currentRound, round.currentTurn)
    }

    private emitHintsToHinters(hinters: Player[], hints: Hint[], currentRound: number, currentTurn: number): void {
        hinters.forEach((client: Player) =>
            this.emitter.hasClient(client.id) && this.emitter.emitToClient(client.id, "turn-hints", {hints, currentRound, currentTurn}))
    }

    private emitRevealToHinters(hinters: Player[], reveal: boolean, currentRound: number, currentTurn: number): void {
        hinters.forEach((client: Player) =>
            this.emitter.hasClient(client.id) && this.emitter.emitToClient(client.id, 'turn-hints-reveal', {reveal, currentRound, currentTurn}))
    }

    private startDeduplication(store: GameStore): void {
        const {gameState: {currentRound, rounds}}: { gameState: GameState } = store;
        const {currentTurn, turns}: Round = rounds[currentRound]
        const turn: Turn = turns[currentTurn]
        turn.deduplication = true;
        this.emitStartDeduplication(turn.deduplication, currentRound, currentTurn)
    }

    private emitAnnounceDeduplication(): void {
        this.emitter.emit('announce-deduplication', {message: "deduplication start"})
    }

    private emitStartDeduplication(deduplication: boolean, currentRound: number, currentTurn: number): void {
        this.emitter.emit('start-deduplication', {deduplication, currentRound, currentTurn})
    }

    private emitHintEnd(): void {
        this.emitter.emit('end-hint', {message: "hint end"});
    }
}