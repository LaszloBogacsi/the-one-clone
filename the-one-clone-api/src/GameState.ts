import {GameConfig} from "./GameConfig";
import {Round} from "./Round";

export class GameState {
    public gameConfig: GameConfig;
    public rounds: Round[] = []
    public inLobby: boolean
    public currentRound: number

    constructor(gameConfig: GameConfig) {
        this.gameConfig = gameConfig
        this.inLobby = true
        this.currentRound = -1
    }

    addRound(round: Round): void {
        this.rounds.push(round)
        this.currentRound += 1
    }

}