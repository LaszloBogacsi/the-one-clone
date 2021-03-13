import {Player} from "./Player";

export class Hint {
    constructor(
        public readonly player: string,
        public readonly hint: string,
        public duplicate: boolean) {
    }
}