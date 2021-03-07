import {GameEvent} from "./GameEvent";
import {GameStore} from "./GameStore";
import {Emitter} from "./Emitter";
import {GameState, Hint, Player, Round, Turn} from "./Room2";

export class HintToDedupe implements GameEvent {
    constructor(private readonly emitter: Emitter) {
    }

    handle(store: GameStore): Promise<void> {
        this._hintEnd(store);
        this._markDuplicatesForCurrentTurn(store);
        return new Promise(resolve => this._deduplicate(store, resolve));
    }

    _hintEnd(store: GameStore) {
        clearInterval(store.countDownInterval);  //TODO: is this necessary?
        this._emitHintEnd();
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

    _deduplicate(store: GameStore, resolve: (value?: void) => void) {
        setTimeout(() => {
            this._revealHintsToHinters(store);
            this._announceDeduplication();
        })
        setTimeout(() => {
            this._startDeduplication(store);
            resolve();
        }, 2000)
    }

    _revealHintsToHinters(store: GameStore) {
        const {gameState, clients}: { gameState: GameState, clients: Player[] } = store;
        const {rounds, currentRound} = gameState;
        const round: Round = rounds[currentRound]
        const turn: Turn = round.turns[round.currentTurn]
        const hinters = clients.filter((client: Player) => !client.isGuessing);
        this._emitHintsToHinters(hinters, turn.hints, currentRound, round.currentTurn)
        turn.reveal = true
        this._emitRevealToHinters(hinters, turn.reveal, currentRound, round.currentTurn)
    }

    _emitHintsToHinters(hinters: Player[], hints: Hint[], currentRound: number, currentTurn: number) {
        hinters.forEach((client: Player) =>
            this.emitter.hasClient(client.id) && this.emitter.emitToClient(client.id, "turn-hints", {hints, currentRound, currentTurn}))
    }

    _emitRevealToHinters(hinters: Player[], reveal: boolean, currentRound: number, currentTurn: number) {
        hinters.forEach((client: Player) =>
            this.emitter.hasClient(client.id) && this.emitter.emitToClient(client.id, 'turn-hints-reveal', {reveal, currentRound, currentTurn}))
    }

    _startDeduplication(store: GameStore) {
        const {gameState: {currentRound, rounds}}: { gameState: GameState } = store;
        const {currentTurn, turns}: Round = rounds[currentRound]
        const turn: Turn = turns[currentTurn]
        turn.deduplication = true;
        this._emitStartDeduplication(turn.deduplication, currentRound, currentTurn)
    }

    _announceDeduplication() {
        this._emitAnnounceDeduplication()
    }

    _emitAnnounceDeduplication() {
        this.emitter.emit('announce-deduplication', {message: "deduplication start"})
    }

    _emitStartDeduplication(deduplication: boolean, currentRound: number, currentTurn: number) {
        this.emitter.emit('start-deduplication', {deduplication, currentRound, currentTurn})
    }

    _emitHintEnd() {
        this.emitter.emit('end-hint', {message: "hint end"});
    }
}