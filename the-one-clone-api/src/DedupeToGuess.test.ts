import {Emitter} from "./Emitter";
import {GameStore} from "./GameStore";
import {Hint} from "./Hint";
import {Round} from "./Round";
import {GameConfig} from "./GameConfig";
import {DedupeToGuess} from "./DedupeToGuess";
import {Turn} from "./Turn";
import Sinon from "sinon";

const sinon = require('sinon')

const assert = require('assert');
const {describe, it} = require("mocha");
describe('DedupeToGuess', function () {

    let gameEvent: DedupeToGuess;
    let emitSpy: Sinon.SinonSpy;

    beforeEach(function () {
        const stubEmitter = sinon.createStubInstance(Emitter)
        emitSpy = sinon.spy();
        stubEmitter.emit = emitSpy;
        gameEvent = new DedupeToGuess(stubEmitter);
    })

    function withTurns(turns: Turn[]): GameStore {
        return ({
            gameState: {
                gameConfig: {} as any as GameConfig,
                rounds: [
                    {turns, points: 0, currentTurn: 0, effectiveMaxTurn: 3}
                ],
                inLobby: false,
                currentRound: 0,
                addRound: (round: Round) => {
                }
            },
            clients: [],
        })
    }

    describe('deduplication', function () {
        it('should end deduplication', function () {
            const hints: Hint[] = [{hint: "a", player: "abc", duplicate: false},]
            const turns: Turn[] = [
                {hints, result: "success", skip: false, guess: "", deduplication: true, reveal: false, secretWord: ""}
            ]

            const store = withTurns(turns);
            gameEvent.handle(store)
            assert.deepStrictEqual(store.gameState.rounds[0].turns[0].deduplication, false);
        });

        it('should emit end deduplication', function () {
            const hints: Hint[] = [{hint: "a", player: "abc", duplicate: false},]
            const deduplicationInitialState = true;
            const turns: Turn[] = [
                {hints, result: "success", skip: false, guess: "", deduplication: deduplicationInitialState, reveal: false, secretWord: ""}
            ]

            const store = withTurns(turns);
            gameEvent.handle(store)
            const expectedPayload = {
                deduplication: !deduplicationInitialState,
                currentRound: 0,
                currentTurn: 0
            };
            assert.strictEqual(emitSpy.calledWith("end-deduplication", expectedPayload), true);
        });
    });
})
;