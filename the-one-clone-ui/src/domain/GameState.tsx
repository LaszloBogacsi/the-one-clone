import {Round} from "./Round";

export interface GameState {
    rounds: Round[]
    currentRound: number
    maxRound: number
    inLobby: boolean
    maxTurn: number
    hintTimeout: number
    guessTimeout: number
    results: number[]
    showRoles: boolean
    announceRound: boolean
    announceTurn: boolean
    announceGameOver: boolean
}