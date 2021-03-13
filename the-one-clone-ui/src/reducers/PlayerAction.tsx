import {Player} from "../domain/Player";

export type PlayerAction =
    | { type: 'updateGuesser', payload: { id: string } }
    | { type: 'addPlayer', payload: Player }
    | { type: 'updatePlayerIsReady', payload: { id: string, isReady: boolean } }
    | { type: 'removePlayer', payload: Player }
    | { type: 'updateAllPlayers', payload: Player[] }
    | { type: 'assignColor', payload: string[] }