import {Hint} from "./Hint";

export interface Turn {
    secretWord: string
    hints: Hint[]
    reveal: boolean
    guess: string
    result?: string
}