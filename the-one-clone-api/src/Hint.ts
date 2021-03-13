import {Player} from "./Player";

export class Hint {
    constructor(
        public readonly player: Player,
        public readonly hint: string,
        public duplicate: boolean) {
    }
}