import {Hint} from "./Hint";

export interface Turn {
    deduplication: boolean;
    secretWord: string
    hints: Hint[]
    reveal: boolean
    guess: string
    result?: string
}


export enum TurnResultType {
    success ="success", failure = "failure", skip ="skip"
}