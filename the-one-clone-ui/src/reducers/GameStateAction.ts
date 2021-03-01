import {GameState} from "../domain/GameState";
import {Round} from "../domain/Round";
import {Turn} from "../domain/Turn";
import {Hint} from "../domain/Hint";

export type GameStateAction =
    | { type: 'setGameState', payload: GameState }
    | { type: 'setInLobby', payload: boolean }
    | { type: 'addRound', payload: { round: Round, currentRound: number } }
    | { type: 'addTurn', payload: { turn: Turn, currentRound: number, currentTurn: number } }
    | { type: 'addHints', payload: { hints: Hint[], currentRound: number, currentTurn: number } }
    | { type: 'setTurnHintsReveal', payload: { reveal: boolean, currentRound: number, currentTurn: number } }
    | { type: 'setTurnResult', payload: { currentRound: number, currentTurn: number, points: number, maxTurn: number, result: string } }
    | { type: 'setGameResult', payload: number[]}
    | { type: 'showRoundResult', payload: {currentRound: number, showRoundResult: boolean}}
    | { type: 'showRoles', payload: {showRoles: boolean}}
    | { type: 'announceRound', payload: {announceRound: boolean}}
    | { type: 'announceTurn', payload: {announceTurn: boolean}}
    | { type: 'announceGameOver', payload: {gameOver: boolean}}
    | { type: 'announceDeduplication', payload: {announceDeduplication: boolean}}
    | { type: 'setDeduplication', payload: {deduplication: boolean, currentRound: number, currentTurn: number}}
    | { type: 'resetGameState', payload: {}}
    | { type: 'announceGuessStart', payload: {announceGuessStart: boolean}}
