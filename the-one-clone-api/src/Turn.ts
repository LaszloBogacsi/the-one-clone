import {Hint} from "./Hint";
export type TurnResult = 'success' | 'failure' | 'skip'

export class Turn {
    public hints: Hint[];
    public reveal: boolean;
    public guess: string;
    public result?: TurnResult;
    public deduplication: boolean;
    public skip: boolean;

    constructor(public readonly secretWord: string) {
        this.hints = [];
        this.reveal = false;
        this.guess = "";
        this.deduplication = false;
        this.skip = false;
    }
}