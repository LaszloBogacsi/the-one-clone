import Timeout = NodeJS.Timeout;
import {Player} from "./Player";
import {GameState} from "./GameState";
import {Adapter} from "socket.io-adapter";

export interface GameStore{
    clients: Player[];
    gameState: GameState;
}