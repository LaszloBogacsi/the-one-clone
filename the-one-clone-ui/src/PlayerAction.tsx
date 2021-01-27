import {Player} from "./Player";

export type PlayerAction =
    | { type: 'updateGuesser', payload: { id: string, name: string } }
    | { type: 'addPlayer', payload: Player }
    | { type: 'updatePlayerIsReady', payload: { id: string, isReady: boolean } }
    | { type: 'removePlayer', payload: Player }
    | { type: 'updateAllPlayers', payload: Player[] }