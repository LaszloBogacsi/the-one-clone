import {Emitter} from "./Emitter";
import {GameStore} from "./GameStore";
import {GuessToNewTurn} from "./GuessToNewTurn";
import {Player} from "./Player";
import {Turn} from "./Turn";
import {Round} from "./Round";
import {GameConfig} from "./GameConfig";
import Sinon from "sinon";

const sinon = require('sinon')

const assert = require('assert');
const {describe, it} = require("mocha");
describe('GuessToNewTurn', function () {

    let gameEvent: GuessToNewTurn;
    let player: Player;

    let emitSpy: Sinon.SinonSpy;
    beforeEach(function () {
        const stubEmitter: Emitter = sinon.createStubInstance(Emitter);
        emitSpy = sinon.spy();
        stubEmitter.emit = emitSpy;
        gameEvent = new GuessToNewTurn(stubEmitter);
        player = {} as Player;
    })

    function withTurn(turn: Turn): GameStore {
        return ({
            gameState: {
                gameConfig: {} as any as GameConfig,
                rounds: [
                    {turns: [turn], points: 0, currentTurn: 0, effectiveMaxTurn: 3}
                ],
                inLobby: false,
                currentRound: 0,
                addRound: (round: Round) => {
                }
            },
            clients: [],
        })
    }

    function withStore(): GameStore {
        const rounds: Round[] = []
        return ({
            gameState: {
                gameConfig: new GameConfig(3, 1000, 1000, 1000, 3),
                rounds,
                inLobby: false,
                currentRound: 0,
                addRound: (round: Round) => {
                    rounds.push(round)
                }
            },
            clients: [],
        })
    }

    describe('#getTurnResult()', function () {
        it('should return success when the guess matches', function () {
            const turn = new Turn("secret")
            turn.guess = "secret";
            gameEvent.handle(withTurn(turn))
            assert.strictEqual(turn.result, "success");
        });

        it('should return success when the guess matches but has whitespace', function () {
            const turn = new Turn("secret")
            turn.guess = "   secret  ";
            gameEvent.handle(withTurn(turn))
            assert.strictEqual(turn.result, "success");
        });

        it('should return success when the guess matches but has tab', function () {
            const turn = new Turn("secret")
            turn.guess = "   secret  \t";
            gameEvent.handle(withTurn(turn))
            assert.strictEqual(turn.result, "success");
        });

        it('should return success when the guess matches but different case', function () {
            const turn = new Turn("secret")
            turn.guess = "SECRET";
            gameEvent.handle(withTurn(turn))
            assert.strictEqual(turn.result, "success");
        });

        it('should return failure when the guess not matches', function () {
            const turn = new Turn("secret")
            turn.guess = "badguess";
            gameEvent.handle(withTurn(turn))
            assert.strictEqual(turn.result, "failure");
        });

        it('should return skip when the guess is skipped', function () {
            const turn = new Turn("secret")
            turn.guess = "";
            turn.skip = true;
            gameEvent.handle(withTurn(turn))
            assert.strictEqual(turn.result, "skip");
        });
    });

    describe('#calculatePoints()', function () {

        afterEach(function () {
            // @ts-ignore
            GuessToNewTurn.getTurnResult.restore();
        })

        function addTurn(round: Round, turn: Turn) {
            round.turns.push(turn);
            round.currentTurn += 1;
        }

        it('should increase the points on success', async function () {
            const store = withStore();
            const {rounds, gameConfig, currentRound, addRound} = store.gameState;
            const round = new Round(gameConfig.maxTurn)
            addRound(round)
            addTurn(round, new Turn(""))

            sinon.stub(GuessToNewTurn, "getTurnResult").returns("success");
            assert.strictEqual(rounds[currentRound].points, 0);

            await gameEvent.handle(store)
            assert.strictEqual(rounds[currentRound].points, 1);
            assert.deepStrictEqual(emitSpy.args[0], ["turn-result", {currentRound: 0, currentTurn: 0, points: 1, maxTurn: 3, result: "success"}])
        });

        it('should decrease the max number of turns on failure', async function () {
            const store = withStore();
            const {rounds, gameConfig, currentRound, addRound} = store.gameState;
            const round = new Round(gameConfig.maxTurn);
            round.points = 2;
            addRound(round);
            addTurn(round, new Turn(""))
            sinon.stub(GuessToNewTurn, "getTurnResult").returns("failure");

            await gameEvent.handle(store);
            assert.strictEqual(rounds[currentRound].effectiveMaxTurn, 2);
            assert.deepStrictEqual(emitSpy.args[0], ["turn-result", {currentRound: 0, currentTurn: 0, points: 2, maxTurn: 2, result: "failure"}])

        });

        it('should decrease the points on failure when it is the last turn', async function () {
            const store = withStore();
            const {rounds, currentRound, addRound} = store.gameState;
            const round = new Round(1)
            round.points = 2;
            addTurn(round, new Turn(""))
            addTurn(round, new Turn(""))
            addRound(round)
            sinon.stub(GuessToNewTurn, "getTurnResult").returns("failure");
            round.currentTurn = 1
            await gameEvent.handle(store)
            assert.strictEqual(rounds[currentRound].effectiveMaxTurn, 1);
            assert.strictEqual(rounds[currentRound].points, 1);
            assert.deepStrictEqual(emitSpy.args[0], ["turn-result", {currentRound: 0, currentTurn: 1, points: 1, maxTurn: 1, result: "failure"}])

        });

        it('should not decrease the points on failure when it is zero and it is the last turn', async function () {
            const store = withStore();
            const {rounds, currentRound, addRound} = store.gameState;
            const round = new Round(2)
            addTurn(round, new Turn(""))
            addTurn(round, new Turn(""))
            addRound(round)
            sinon.stub(GuessToNewTurn, "getTurnResult").returns("failure");
            round.currentTurn = 0;
            round.points = 0;
            await gameEvent.handle(store)
            assert.strictEqual(rounds[currentRound].points, 0);
            assert.strictEqual(rounds[currentRound].effectiveMaxTurn, 1);
            assert.deepStrictEqual(emitSpy.args[0], ["turn-result", {currentRound: 0, currentTurn: 0, points: 0, maxTurn: 1, result: "failure"}])

            rounds[currentRound].currentTurn = 1
            await gameEvent.handle(store)
            assert.strictEqual(rounds[currentRound].points, 0);
            assert.strictEqual(rounds[currentRound].effectiveMaxTurn, 1);
            assert.deepStrictEqual(emitSpy.args[1], ["turn-result", {currentRound: 0, currentTurn: 1, points: 0, maxTurn: 1, result: "failure"}])

        });

        it('should not change the points on skip when it is the last turn', async function () {
            const store = withStore();
            const {rounds, currentRound, addRound} = store.gameState;
            const round = new Round(2)
            round.points = 1;
            addTurn(round, new Turn(""))
            addTurn(round, new Turn(""))
            addTurn(round, new Turn(""))
            addRound(round)
            sinon.stub(GuessToNewTurn, "getTurnResult").returns("skip");
            round.currentTurn = 2
            await gameEvent.handle(store)
            assert.strictEqual(rounds[currentRound].effectiveMaxTurn, 2);
            assert.strictEqual(rounds[currentRound].points, 1);
            emitSpy.calledOnceWithExactly(0, 2, 1, 2, "skip")
            assert.deepStrictEqual(emitSpy.args[0], ["turn-result", {currentRound: 0, currentTurn: 2, points: 1, maxTurn: 2, result: "skip"}])
        });
    });


});