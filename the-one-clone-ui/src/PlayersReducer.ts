import {Player} from "./Player";
import {PlayerAction} from "./PlayerAction";

export const playersReducer = (state: Player[], action: PlayerAction): Player[] => {
    switch (action.type) {
        case "updateAllPlayers":
            return [...state];
        case "removePlayer":
            return state.filter(player => player.id !== action.payload.id);
        case "updatePlayerIsReady":
            return [...state.map(player => {
                if (player.id === action.payload.id) {
                    player.isReady = action.payload.isReady;
                }
                return player;
            })]
        case "addPlayer":
            return state.findIndex((player => player.id === action.payload.id)) === -1 ? [...state, action.payload] : state;
        case "updateGuesser":
            return [...state.map(player => {
                player.isGuessing = false;
                if (player.id === action.payload.id) {
                    return {...player, isGuessing: true};
                }
                return player
            })]
        default:
            throw new Error(`unsupported action type`)
    }
};