import {GameEvent} from "./GameEvent";
import {Emitter} from "./Emitter";
import {GameStore} from "./GameStore";
import {GameState, Player} from "./Room2";

export class GameOver implements GameEvent {
    private readonly timeouts: number[] = []

    constructor(private readonly emitter: Emitter) {
    }

    handle(store: GameStore): Promise<void> {
        this.gameOver(store);
        return Promise.resolve(undefined);
    }

    cancel(): void {
        this.timeouts.forEach(clearTimeout);
    }

    private gameOver(store: GameStore) {
        const intervalMs = 2000;
        const timingFor = (event: string) => new Map([["announce", intervalMs], ["transition", intervalMs * 2]]).get(event);
        this.timeouts.push(setTimeout(this.announceGameOver.bind(this), timingFor("announce")));
        this.timeouts.push(setTimeout(this.doGameOver.bind(this, store), timingFor("transition")));
    }

    private doGameOver(store: GameStore) {
        const {clients, gameState}: { clients: Player[], gameState: GameState } = store;
        clients.forEach((client: Player) => {
            client.isGuessing = false;
            client.isReady = false;
        })
        gameState.inLobby = true;
        this.emitter.emit("end-game", {inLobby: gameState.inLobby})
        this.emitter.emit('show-all-players', {players: clients})
        const results = gameState.rounds.map(round => round.points)
        this.emitter.emit("game-result", {results})
    }

    private announceGameOver() {
        this.emitter.emit('game-over-announcement', {gameOver: true})
    }
}