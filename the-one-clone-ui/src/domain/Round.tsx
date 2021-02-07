import {Turn} from "./Turn";

export interface Round {
    turns: Turn[]
    points: number
    currentTurn: number
    showRoundResults?: boolean
}