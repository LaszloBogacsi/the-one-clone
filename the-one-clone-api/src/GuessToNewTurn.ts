import {GameEvent} from "./GameEvent";
import {Emitter} from "./Emitter";
import {GameStore} from "./GameStore";
import {GameConfig, GameState, Round, Turn, TurnResult} from "./Room2";

export class GuessToNewTurn implements GameEvent {
    constructor(private readonly emitter: Emitter) {
    }

    handle(store: GameStore): Promise<void> {
        return new Promise(resolve => {
            this._revealTurnResult(store);
            resolve();
        })
    }

    _revealTurnResult(store: GameStore) {
        const {gameState}: { gameState: GameState } = store;
        const {rounds, currentRound, gameConfig} = gameState;
        const round: Round = rounds[currentRound];
        const turn: Turn = round.turns[round.currentTurn];

        turn.result = this._getTurnResult(turn);

        this._calculatePoints(turn.result, round, gameConfig) // TODO: Don't mutate rounds and gameConfig, return value instead
        this._emitTurnResults(currentRound, round.currentTurn, round.points, gameConfig.maxTurn, turn.result)
    }

    _getTurnResult(turn: Turn): TurnResult {
        const match = turn.guess.trim().toUpperCase() === turn.secretWord.toUpperCase();
        return turn.skip ? 'skip' : match ? 'success' : 'failure'
    }

    _calculatePoints(result: TurnResult, round: Round, gameConfig: GameConfig): void {
        switch (result) {
            case 'success':
                round.points += 1
                break;
            case 'failure':
                round.currentTurn === gameConfig.maxTurn ? round.points = Math.max(0, round.points - 1) : gameConfig.maxTurn -= 1 // TODO: Maybe a round shoud have an effective max turn
                break;
            case "skip":
                break;
            default:
                throw new Error(`Unsupported turn result: ${result}`);
        }
    }

    _emitTurnResults(currentRound: number, currentTurn: number, points: number, maxTurn: number, result: string) {
        this.emitter.emit('turn-result', {currentRound, currentTurn, points, maxTurn, result})
    }

}