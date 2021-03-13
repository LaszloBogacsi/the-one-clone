import {GameEvent} from "./GameEvent";
import {Emitter} from "./Emitter";
import {GameStore} from "./GameStore";
import {Turn, TurnResult} from "./Turn";
import {Round} from "./Round";
import {GameState} from "./GameState";

export class GuessToNewTurn implements GameEvent {

    constructor(private readonly emitter: Emitter) {
    }

    public handle(store: GameStore): Promise<void> {
        return new Promise(resolve => {
            this.revealTurnResult(store);
            resolve();
        })
    }

    public cancel(): void {
        // nothing here
    }

    private revealTurnResult(store: GameStore): void {
        const {gameState}: { gameState: GameState } = store;
        const {rounds, currentRound} = gameState;
        const round: Round = rounds[currentRound];
        const turn: Turn = round.turns[round.currentTurn];

        turn.result = GuessToNewTurn.getTurnResult(turn);

        const {points, effectiveMaxTurn} = GuessToNewTurn.calculatePoints(turn.result, round);
        const newRound = {...round, points, effectiveMaxTurn};
        rounds[currentRound] = newRound
        this.emitTurnResults(currentRound, newRound.currentTurn, newRound.points, newRound.effectiveMaxTurn, turn.result)
    }

    static getTurnResult(turn: Turn): TurnResult {
        const match = turn.guess.trim().toUpperCase() === turn.secretWord.toUpperCase();
        return turn.skip ? 'skip' : match ? 'success' : 'failure'
    }

    private static calculatePoints(result: TurnResult, round: Round): {points: number, effectiveMaxTurn: number} {
        switch (result) {
            case 'success':
                return {points: round.points + 1, effectiveMaxTurn: round.effectiveMaxTurn}
            case 'failure':
                return {
                    points: round.currentTurn === round.effectiveMaxTurn ? Math.max(0, round.points - 1) : round.points,
                    effectiveMaxTurn: round.currentTurn === round.effectiveMaxTurn ? round.effectiveMaxTurn : round.effectiveMaxTurn - 1
                }
            case "skip":
                return {points: round.points, effectiveMaxTurn: round.effectiveMaxTurn};
            default:
                throw new Error(`Unsupported turn result: ${result}`);
        }
    }

    private emitTurnResults(currentRound: number, currentTurn: number, points: number, maxTurn: number, result: string): void {
        this.emitter.emit('turn-result', {currentRound, currentTurn, points, maxTurn, result})
    }
}