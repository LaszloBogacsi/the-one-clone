import {HintToDedupe} from "./HintToDedupe";
import {Emitter} from "./Emitter";
import {GameStore} from "./GameStore";
import {Player, PlayerRole} from "./Player";
import {Hint} from "./Hint";
import {Round} from "./Round";
import {GameConfig} from "./GameConfig";
import {StartNewTurn} from "./StartNewTurn";
import {GuessToNewTurn} from "./GuessToNewTurn";

const sinon = require('sinon')

const assert = require('assert');
const {describe, it} = require("mocha");
describe('StartNewTurn', function () {

    let gameEvent: StartNewTurn;
    let playerId: string;

    beforeEach(function () {
        const stubEmitter = sinon.createStubInstance(Emitter)
        gameEvent = new StartNewTurn("roomId123", stubEmitter, {getRandomWord: () => ""});
        playerId = "playerID"
    })
    function withClients(clients: Player[]): GameStore {
        return ({
            gameState: {
                gameConfig: {} as any as GameConfig,
                    rounds: [
                    {turns: [{hints: [], result: "success", skip:false, guess: "", deduplication: false, reveal: false, secretWord: ""}], points: 0, currentTurn: 0, effectiveMaxTurn: 3}
                ],
                    inLobby: false,
                    currentRound: 0,
                    addRound: (round: Round) => {}
            },
            clients,
        })
    }
    describe('roles', function () {
        const hinterPlayer: Player = {id: Math.ceil(Math.random() * 100).toString(), playerName: "Player2", isReady: true, role: PlayerRole.HINTER}

        it('should appoint a new guesser', async function () {
            const clients: Player[] = [{...hinterPlayer}, {...hinterPlayer}]
            const timingStub = sinon.stub().returns(0);
            sinon.stub(gameEvent, "getEventTiming").returns(timingStub);

            await gameEvent.handle(withClients(clients))
            assert.deepStrictEqual(clients[1].role, PlayerRole.GUESSER);
        });

        it('should appoint a new guesser, based on current turn the guesser is always the next player', async function () {
            const clients: Player[] = [{...hinterPlayer}, {...hinterPlayer}, {...hinterPlayer}]
            const timingStub = sinon.stub().returns(0);
            sinon.stub(gameEvent, "getEventTiming").returns(timingStub);

            const store = withClients(clients);
            await gameEvent.handle(store)
            assert.deepStrictEqual(clients[1].role, PlayerRole.GUESSER);
            await gameEvent.handle(store)
            assert.deepStrictEqual(clients[2].role, PlayerRole.GUESSER);
        });

        it('should appoint a new guesser, based on current turn when the turn number ig reater than the number of players', async function () {
            const clients: Player[] = [{...hinterPlayer}, {...hinterPlayer}, {...hinterPlayer}]
            const timingStub = sinon.stub().returns(0);
            sinon.stub(gameEvent, "getEventTiming").returns(timingStub);

            const store = withClients(clients);
            store.gameState.rounds[0].currentTurn = 1
            await gameEvent.handle(store)
            assert.deepStrictEqual(clients[2].role, PlayerRole.GUESSER);
            await gameEvent.handle(store)
            assert.deepStrictEqual(clients[0].role, PlayerRole.GUESSER);
        });
    });
});