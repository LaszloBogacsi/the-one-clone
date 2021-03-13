export class GameConfig {
    constructor(
        public maxRounds: number,
        public hintTimeout: number,
        public guessTimeout: number,
        public dedupeTimeout: number,
        public maxTurn: number) {
    }
}