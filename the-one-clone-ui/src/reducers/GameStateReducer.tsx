import {GameState} from "../domain/GameState";
import {GameStateAction} from "./GameStateAction";

export function gameStateReducer(state: GameState, action: GameStateAction): GameState {
    const {rounds} = state;
    switch (action.type) {
        case "announceGameOver":
            return {
                ...state,
                announceGameOver: action.payload.gameOver
            }
        case "announceRound":
            return {
                ...state,
                announceRound: action.payload.announceRound
            }
        case "announceTurn":
            return {
                ...state,
                announceTurn: action.payload.announceTurn
            }
        case "showRoles":
            return {
                ...state,
                showRoles: action.payload.showRoles
            }
        case "showRoundResult":
            return {
                ...state,
                rounds: rounds.map((round, index) => {
                    if (index === action.payload.currentRound) round.showRoundResults = action.payload.showRoundResult;
                    return round;
                })
            }
        case "setGameResult":
            return {...state, results: [...action.payload]}
        case "setTurnResult":
            return {
                ...state,
                rounds: rounds.map((round, index) => {
                    const {currentRound, currentTurn, points, result} = action.payload;
                    if (index === currentRound) {
                        round.points = points;
                        round.turns.map((turn, index) => {
                            if (index === currentTurn) {
                                turn.result = result;
                                return turn;
                            }
                            return turn;
                        })
                    }
                    return round;
                }),
                maxTurn: action.payload.maxTurn
            }
        case "setTurnHintsReveal":
            return {
                ...state, rounds: rounds.map((round, index) => {
                    const {reveal, currentTurn, currentRound} = action.payload;
                    if (index === currentRound) {
                        round.turns.map((turn, index) => {
                            if (index === currentTurn) {
                                turn.reveal = reveal;
                                return turn;
                            }
                            return turn;
                        })
                    }
                    return round;
                })
            }
        case "addHints":
            return {
                ...state, rounds: rounds.map((round, index) => {
                    const {currentTurn, currentRound, hints} = action.payload;
                    if (index === currentRound) {
                        round.turns.map((turn, index) => {
                            if (index === currentTurn) {
                                turn.hints = [...hints];
                                return turn;
                            }
                            return turn;
                        })
                    }
                    return round;
                })
            }

        case "addTurn":
            const {turn, currentRound, currentTurn} = action.payload;
            return {
                ...state,
                rounds: [...rounds.slice(0, currentRound), {
                    ...(rounds[currentRound]),
                    turns: [...rounds[currentRound].turns, turn],
                    currentTurn
                }]
            }
        case "addRound":
            return {...state, rounds: [...rounds, action.payload.round], currentRound: action.payload.currentRound}
        case "setInLobby":
            return {...state, inLobby: action.payload};
        case 'setGameState':
            return {...action.payload};
        default:
            throw new Error(`unsupported action type`)
    }
}