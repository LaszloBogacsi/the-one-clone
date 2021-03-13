import {Turn} from "./Turn";

export class Round {
    public readonly turns: Turn[] = []
    public points = 0
    public currentTurn = -1
    public effectiveMaxTurn;

    constructor(maxTurn: number) {
        this.effectiveMaxTurn = maxTurn;
    }

}