import {GameEvent} from "./GameEvent";
import {GameStore} from "./GameStore";
import {Emitter} from "./Emitter";
import {GameState, Hint, Player, Round, Turn} from "./Room2";

export class DedupeToGuess implements GameEvent {
    constructor(private readonly emitter: Emitter) {
    }

    handle(store: GameStore): Promise<void> {
        this._announceGuessStart(true)

        return new Promise(resolve => setTimeout(() => {
            this._announceGuessStart(false);
            this._revealHintsToGuesser(store);
            resolve();
        }, 2000));
    }

    _revealHintsToGuesser(store: GameStore) {
        const {gameState}: { gameState: GameState } = store;
        const {rounds, currentRound} = gameState;
        const round: Round = rounds[currentRound]
        const turn: Turn = round.turns[round.currentTurn]

        const sortByDuplicatesLast = (a: Hint, b: Hint) => +a - +b;
        const guesser = store.clients.filter((client: Player) => client.isGuessing);
        this._emitHintsToGuesser(guesser, turn.hints.map(hint => hint.duplicate ? {...hint, hint: "Duplicate"} : hint).sort(sortByDuplicatesLast), currentRound, round.currentTurn)
        turn.reveal = true
        this._emitRevealToGuesser(guesser, turn.reveal, currentRound, round.currentTurn)
    }

    _emitHintsToGuesser(guesser: Player[], hints: Hint[], currentRound: number, currentTurn: number) {
        guesser.forEach((client: Player) => {
            this.emitter.hasClient(client.id) && this.emitter.emitToClient(client.id, "turn-hints", {hints, currentRound, currentTurn})
        })
    }

    _emitRevealToGuesser(guesser: Player[], reveal: boolean, currentRound: number, currentTurn: number) {
        guesser.forEach((client: Player) => {
            this.emitter.hasClient(client.id) && this.emitter.emitToClient(client.id, 'turn-hints-reveal', {reveal, currentRound, currentTurn})
        })
    }
    _announceGuessStart(shouldAnnounce: boolean) {
        this._emitAnnounceGuessStart(shouldAnnounce)
    }

    _emitAnnounceGuessStart(announce: boolean) {
        this.emitter.emit('announce-guess-start', {announceGuessStart: announce})
    }
}