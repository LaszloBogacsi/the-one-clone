import {GameStore} from "./GameStore";

export interface GameEvent {
    handle: (store: GameStore) => Promise<void>
}
