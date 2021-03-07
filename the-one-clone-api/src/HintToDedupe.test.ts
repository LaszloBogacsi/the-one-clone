import {Hint, Player, Room2, Turn, Round, GameConfig} from "./Room2";
import {HintToDedupe} from "./HintToDedupe";
import {Emitter} from "./Emitter";
import {GameStore} from "./GameStore";
import Timeout = NodeJS.Timeout;

const sinon = require('sinon')

const assert = require('assert');
const {describe, it} = require("mocha");
describe('Room', function () {

    let gameEvent: HintToDedupe;
    let player: Player;

    beforeEach(function () {
        const stubEmitter = sinon.createStubInstance(Emitter)
        gameEvent = new HintToDedupe(stubEmitter);
        player = {} as Player;
    })
    function withHints(hints: Hint[]): GameStore {
        return ({
            gameState: {
                gameConfig: {} as any as GameConfig,
                    rounds: [
                    {turns: [{hints, result: "success", skip:false, guess: "", deduplication: false, reveal: false, secretWord: ""}], points: 0, currentTurn: 0, addTurn: (turn: Turn) => {}}
                ],
                    inLobby: false,
                    currentRound: 0,
                    addRound: (round: Round) => {}
            },
            clients: [],
            countDownTimeout: {} as any as Timeout,
            countDownInterval: {} as any as Timeout
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
                {hint: "a", player, duplicate: false},
            ]
            const expectedHints: Hint[] = [
                {hint: "a", player, duplicate: false},
            ]
            gameEvent.handle(withHints(hints))
            assert.deepStrictEqual(hints, expectedHints);
        });
        it('should mark all duplicate items when all items are duplicates', function () {
            const hints: Hint[] = [
                {hint: "a", duplicate: false, player},
                {hint: "a", duplicate: false, player}
            ]
            const expectedHints: Hint[] = [
                {hint: "a", duplicate: true, player},
                {hint: "a", duplicate: true, player}
            ]
            gameEvent.handle(withHints(hints))
            assert.deepStrictEqual(hints, expectedHints);
        });
        it('should mark all duplicate items', function () {
            const hints: Hint[] = [
                {hint: "a", duplicate: false, player},
                {hint: "b", duplicate: false, player},
                {hint: "a", duplicate: false, player}
            ]
            const expectedHints: Hint[] = [
                {hint: "a", duplicate: true, player},
                {hint: "a", duplicate: true, player},
                {hint: "b", duplicate: false, player},
            ]
            gameEvent.handle(withHints(hints))
            assert.deepStrictEqual(hints, expectedHints);
        });
    });
});