import {GameEvent} from "./GameEvent";
import {Emitter} from "./Emitter";
import {GameStore} from "./GameStore";
import {Player, PlayerRole} from "./Player";
import {GameState} from "./GameState";

export class GameOver implements GameEvent {
    private readonly timeouts: number[] = []

    constructor(private readonly emitter: Emitter) {
    }

    handle(store: GameStore): Promise<void> {
        return new Promise(resolve => this.gameOver(store, resolve))
    }

    cancel(): void {
        this.timeouts.forEach(clearTimeout);
    }

    private timingFor(event: string) {
        const intervalMs = 2000;
        return new Map([["announce", intervalMs], ["transition", intervalMs * 2]]).get(event);
    }

    private gameOver(store: GameStore, resolve: (value: (PromiseLike<void> | void)) => void) {
        this.timeouts.push(setTimeout(this.announceGameOver.bind(this), this.timingFor("announce")));
        this.timeouts.push(setTimeout(this.doGameOver.bind(this, store, resolve), this.timingFor("transition")));
    }

    private doGameOver(store: GameStore, resolve: (value: (PromiseLike<void> | void)) => void) {
        const {clients, gameState}: { clients: Player[], gameState: GameState } = store;
        clients.forEach((client: Player) => {
            if (client.role === PlayerRole.GUESSER) client.role = PlayerRole.HINTER;
            client.isReady = false;
        })
        gameState.inLobby = true;
        this.emitter.emit("end-game", {inLobby: gameState.inLobby})
        this.emitter.emit('show-all-players', {players: clients})
        const results = gameState.rounds.map(round => round.points)
        this.emitter.emit("game-result", {results})
        resolve();
    }

    private announceGameOver() {
        this.emitter.emit('game-over-announcement', {gameOver: true})
    }
}