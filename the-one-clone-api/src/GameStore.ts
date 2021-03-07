import {GameState, Player} from "./Room2";
import Timeout = NodeJS.Timeout;

export interface GameStore {
    clients: Player[];
    gameState: GameState;
    countDownTimeout: Timeout;
    countDownInterval: Timeout;
}