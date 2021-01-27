import {GameState} from "./GameState";
import {Round} from "./Round";
import {Turn} from "./Turn";
import {Hint} from "./Hint";

export type GameStateAction =
    | { type: 'setGameState', payload: GameState }
    | { type: 'setInLobby', payload: boolean }
    | { type: 'addRound', payload: { round: Round, currentRound: number } }
    | { type: 'addTurn', payload: { turn: Turn, currentRound: number, currentTurn: number } }
    | { type: 'addHints', payload: { hints: Hint[], currentRound: number, currentTurn: number } }
    | { type: 'setTurnHintsReveal', payload: { reveal: boolean, currentRound: number, currentTurn: number } }
    | { type: 'setTurnResult', payload: { currentRound: number, currentTurn: number, points: number, maxTurn: number, result: string } }
    | { type: 'setGameResult', payload: number[]}
