import {HintToDedupe} from "./HintToDedupe";
import {Emitter} from "./Emitter";
import {GameStore} from "./GameStore";
import {Player, PlayerRole} from "./Player";
import {Hint} from "./Hint";
import {Round} from "./Round";
import {GameConfig} from "./GameConfig";
import {StartNewTurn} from "./StartNewTurn";
import {GuessToNewTurn} from "./GuessToNewTurn";
import {GameOver} from "./GameOver";

const sinon = require('sinon')

const assert = require('assert');
const {describe, it} = require("mocha");
describe('GameOver', function () {

    let gameEvent: GameOver;

    beforeEach(function () {
        const stubEmitter = sinon.createStubInstance(Emitter)
        gameEvent = new GameOver(stubEmitter);
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
    describe('demote guesser', function () {
        const hinterPlayer: Player = {id: Math.ceil(Math.random() * 100).toString(), playerName: "Player2", isReady: true, role: PlayerRole.HINTER}
        const adminHinterPlayer: Player = {id: Math.ceil(Math.random() * 100).toString(), playerName: "Player2", isReady: true, role: PlayerRole.ADMIN_HINTER}
        const guesserPlayer: Player = {id: Math.ceil(Math.random() * 100).toString(), playerName: "Player2", isReady: true, role: PlayerRole.GUESSER}

        it('should reset roles', async function () {
            const clients: Player[] = [hinterPlayer, adminHinterPlayer, guesserPlayer]
            sinon.stub(gameEvent, "timingFor").returns(0);

            const store = withClients(clients);
            await gameEvent.handle(store)
            store.clients.forEach(client => {
                assert.notDeepStrictEqual(client.role, PlayerRole.GUESSER);
            })
            assert.deepStrictEqual(clients[1].role, PlayerRole.ADMIN_HINTER);
            assert.deepStrictEqual(clients[0].role, PlayerRole.HINTER);
        });

    });
});