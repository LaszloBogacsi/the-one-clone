import Timeout = NodeJS.Timeout;
import {Player} from "./Player";
import {GameState} from "./GameState";

export interface GameStore {
    clients: Player[];
    gameState: GameState;
    countDownTimeout: Timeout;
    countDownInterval: Timeout;
}