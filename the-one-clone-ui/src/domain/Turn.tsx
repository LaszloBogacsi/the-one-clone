import {Hint} from "./Hint";

export interface Turn {
    deduplication: boolean;
    secretWord: string
    hints: Hint[]
    reveal: boolean
    guess: string
    result?: string
}