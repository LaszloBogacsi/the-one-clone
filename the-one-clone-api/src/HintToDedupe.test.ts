import {HintToDedupe} from "./HintToDedupe";
import {Emitter} from "./Emitter";
import {GameStore} from "./GameStore";
import {Hint} from "./Hint";
import {Round} from "./Round";
import {GameConfig} from "./GameConfig";

const sinon = require('sinon')

const assert = require('assert');
const {describe, it} = require("mocha");
describe('Room', function () {

    let gameEvent: HintToDedupe;
    let playerId: string;

    beforeEach(function () {
        const stubEmitter = sinon.createStubInstance(Emitter)
        gameEvent = new HintToDedupe(stubEmitter);
        playerId = "playerID"
    })

    function withHints(hints: Hint[]): GameStore {
        return ({
            gameState: {
                gameConfig: {} as any as GameConfig,
                rounds: [
                    {
                        turns: [{
                            hints,
                            result: "success",
                            skip: false,
                            guess: "",
                            deduplication: false,
                            reveal: false,
                            secretWord: ""
                        }], points: 0, currentTurn: 0, effectiveMaxTurn: 3
                    }
                ],
                inLobby: false,
                currentRound: 0,
                addRound: (round: Round) => {
                }
            },
            clients: [],
        })
    }

    describe('#markDuplicates()', function () {
        it('should should handle empty array', function () {
            const hints: Hint[] = []
            const expectedHints: Hint[] = []
            gameEvent.handle(withHints(hints))
            assert.deepStrictEqual(hints, expectedHints);
        });
        it('should not mark items as duplicate when only one item present', function () {
            const hints: Hint[] = [
                {hint: "a", player: playerId, duplicate: false},
            ]
            const expectedHints: Hint[] = [
                {hint: "a", player: playerId, duplicate: false},
            ]
            gameEvent.handle(withHints(hints))
            assert.deepStrictEqual(hints, expectedHints);
        });
        it('should mark all duplicate items when all items are duplicates', function () {
            const hints: Hint[] = [
                {hint: "a", duplicate: false, player: playerId},
                {hint: "a", duplicate: false, player: playerId}
            ]
            const expectedHints: Hint[] = [
                {hint: "a", duplicate: true, player: playerId},
                {hint: "a", duplicate: true, player: playerId}
            ]
            gameEvent.handle(withHints(hints))
            assert.deepStrictEqual(hints, expectedHints);
        });
        it('should mark all duplicate items', function () {
            const hints: Hint[] = [
                {hint: "a", duplicate: false, player: playerId},
                {hint: "b", duplicate: false, player: playerId},
                {hint: "a", duplicate: false, player: playerId}
            ]
            const expectedHints: Hint[] = [
                {hint: "a", duplicate: true, player: playerId},
                {hint: "a", duplicate: true, player: playerId},
                {hint: "b", duplicate: false, player: playerId},
            ]
            gameEvent.handle(withHints(hints))
            assert.deepStrictEqual(hints, expectedHints);
        });
    });
});