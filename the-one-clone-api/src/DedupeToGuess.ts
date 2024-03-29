import {GameEvent} from "./GameEvent";
import {GameStore} from "./GameStore";
import {Emitter} from "./Emitter";
import {Player, PlayerRole} from "./Player";
import {Turn} from "./Turn";
import {Hint} from "./Hint";
import {Round} from "./Round";
import {GameState} from "./GameState";

export class DedupeToGuess implements GameEvent {
    private readonly timeouts: number[] = []

    constructor(private readonly emitter: Emitter) {
    }

    public handle(store: GameStore): Promise<void> {
        this.emitAnnounceGuessStart(true);
        this.endDeduplication(store);
        return new Promise(resolve => {
            this.timeouts.push(setTimeout(() => {
                this.emitAnnounceGuessStart(false)
                this.revealHintsToGuesser(store);
                resolve();
            }, DedupeToGuess.getEventTiming("revealHintsToGuesser")));
        });
    }

    public cancel(): void {
        this.timeouts.forEach(clearTimeout);
    };

    private static getEventTiming(event: string): number | undefined {
        const interval = 2000;
        const timings: Map<string, number> = new Map([
            ["revealHintsToGuesser", interval],
        ])
        return timings.get(event);
    }

    private endDeduplication(store: GameStore): void {
        const {round, turn, currentRound} = this.getGameStateDetails(store);
        turn.deduplication = false;
        this.emitEndDeduplication(turn.deduplication, currentRound, round.currentTurn);
    }

    private getGameStateDetails(store: GameStore): { currentRound: number; round: Round; turn: Turn } {
        const {gameState}: { gameState: GameState } = store;
        const {rounds, currentRound} = gameState;
        const round: Round = rounds[currentRound];
        const turn: Turn = round.turns[round.currentTurn];
        return {round, turn, currentRound}
    }

    private revealHintsToGuesser(store: GameStore): void {
        const {round, turn, currentRound} = this.getGameStateDetails(store);
        const sortByDuplicatesLast = (a: Hint, b: Hint) => +a - +b;
        const guesser = store.clients.filter((client: Player) => client.role === PlayerRole.GUESSER);
        this.emitHintsToGuesser(guesser, turn.hints.map(hint => hint.duplicate ? {...hint, hint: "Duplicate"} : hint).sort(sortByDuplicatesLast), currentRound, round.currentTurn);
        turn.reveal = true;
        this.emitRevealToGuesser(guesser, turn.reveal, currentRound, round.currentTurn);
    }

    private emitHintsToGuesser(guesser: Player[], hints: Hint[], currentRound: number, currentTurn: number): void {
        guesser.forEach((client: Player) => {
            this.emitter.hasClient(client.id) && this.emitter.emitToClient(client.id, "turn-hints", {hints, currentRound, currentTurn});
        });
    }

    private emitRevealToGuesser(guesser: Player[], reveal: boolean, currentRound: number, currentTurn: number): void {
        guesser.forEach((client: Player) => {
            this.emitter.hasClient(client.id) && this.emitter.emitToClient(client.id, 'turn-hints-reveal', {reveal, currentRound, currentTurn});
        });
    }

    private emitEndDeduplication(deduplication: boolean, currentRound: number, currentTurn: number): void {
        this.emitter.emit('end-deduplication', {deduplication, currentRound, currentTurn});
    }

    private emitAnnounceGuessStart(announce: boolean): void {
        this.emitter.emit('announce-guess-start', {announceGuessStart: announce});
    }
}