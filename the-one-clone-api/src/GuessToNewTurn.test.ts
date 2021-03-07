import {GameConfig, Player, Round, Turn} from "./Room2";
import {Emitter} from "./Emitter";
import {GameStore} from "./GameStore";
import {GuessToNewTurn} from "./GuessToNewTurn";
import Timeout = NodeJS.Timeout;

const sinon = require('sinon')

var assert = require('assert');
const {describe, it} = require("mocha");
describe('GuessToNewTurn', function () {

    let gameEvent: GuessToNewTurn;
    let player: Player;

    beforeEach(function () {
        const stubEmitter = sinon.createStubInstance(Emitter)
        gameEvent = new GuessToNewTurn(stubEmitter);
        player = {} as Player;
    })

    function withTurn(turn: Turn): GameStore {
        return ({
            gameState: {
                gameConfig: {} as any as GameConfig,
                rounds: [
                    {
                        turns: [turn], points: 0, currentTurn: 0, addTurn: (turn: Turn) => {
                        }
                    }
                ],
                inLobby: false,
                currentRound: 0,
                addRound: (round: Round) => {
                }
            },
            clients: [],
            countDownTimeout: {} as any as Timeout,
            countDownInterval: {} as any as Timeout
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
            countDownTimeout: {} as any as Timeout,
            countDownInterval: {} as any as Timeout
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
        it('should increase the points on success', async function () {
            const round = new Round()
            const store = withStore();
            store.gameState.addRound(round)
            sinon.stub(gameEvent, "_getTurnResult").returns("success");

            round.addTurn(new Turn(""))
            assert.strictEqual(round.points, 0);
            await gameEvent.handle(store)
            assert.strictEqual(round.points, 1);
        });

        it('should decrease the max number of turns on failure', async function () {
            const store = withStore();
            const round = new Round()
            round.points = 2;
            round.addTurn(new Turn(""))
            store.gameState.addRound(round)
            sinon.stub(gameEvent, "_getTurnResult").returns("failure");
            await gameEvent.handle(store)

            assert.strictEqual(store.gameState.gameConfig.maxTurn, 2);
        });

        it('should decrease the points on failure when it is the last turn', async function () {
            const store = withStore();
            const round = new Round()
            round.points = 2;
            round.addTurn(new Turn(""))
            store.gameState.addRound(round)
            sinon.stub(gameEvent, "_getTurnResult").returns("failure");
            round.currentTurn = store.gameState.gameConfig.maxTurn = 0
            await gameEvent.handle(store)
            assert.strictEqual(round.points, 1);
        });

        it('should not decrease the points on failure when it is zero and it is the last turn', async function () {
            const store = withStore();
            const round = new Round()
            round.addTurn(new Turn(""))
            store.gameState.addRound(round)
            sinon.stub(gameEvent, "_getTurnResult").returns("failure");
            round.currentTurn = store.gameState.gameConfig.maxTurn = 0
            await gameEvent.handle(store)
            assert.strictEqual(round.points, 0);
        });

        it('should not change the points on skip when it is the last turn', async function () {
            const store = withStore();
            const round = new Round()
            round.points = 1;
            round.addTurn(new Turn(""))
            store.gameState.addRound(round)
            sinon.stub(gameEvent, "_getTurnResult").returns("skip");
            round.currentTurn = store.gameState.gameConfig.maxTurn = 0
            await gameEvent.handle(store)
            assert.strictEqual(store.gameState.gameConfig.maxTurn, 0);
            assert.strictEqual(round.points, 1);
        });
    });


});