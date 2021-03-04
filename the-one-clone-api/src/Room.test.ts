import {Namespace, Socket} from "socket.io";
import {Hint, Player, Room2, Turn, Round, GameConfig} from "./Room2";

var assert = require('assert');
const {describe, it} = require("mocha");
describe('Room', function () {

    let room: Room2;
    let player: Player;
    beforeEach(function () {
        room = new Room2({io: {} as any as Namespace, roomId: "", playerName: "", action: "", socket: {} as any as Socket});
        player = {} as Player;
    })
    describe('#markDuplicates()', function () {
        it('should should handle empty array', function () {
            const hints: Hint[] = []
            const expectedHints: Hint[] = []
            room._markDuplicates(hints)
            assert.deepStrictEqual(hints, expectedHints);
        });
        it('should not mark items as duplicate when only one item present', function () {
            const hints: Hint[] = [
                {hint: "a", player, duplicate: false},
            ]
            const expectedHints: Hint[] = [
                {hint: "a", player, duplicate: false},
            ]
            room._markDuplicates(hints)
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
            room._markDuplicates(hints)
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
            room._markDuplicates(hints)
            assert.deepStrictEqual(hints, expectedHints);
        });
    });
    describe('#getTurnResult()', function () {
        it('should return success when the guess matches', function () {
            const turn = new Turn("secret")
            turn.guess = "secret";
            assert.strictEqual(room._getTurnResult(turn), "success");
        });

        it('should return success when the guess matches but has whitespace', function () {
            const turn = new Turn("secret")
            turn.guess = "   secret  ";
            assert.strictEqual(room._getTurnResult(turn), "success");
        });

        it('should return success when the guess matches but has tab', function () {
            const turn = new Turn("secret")
            turn.guess = "   secret  \t";
            assert.strictEqual(room._getTurnResult(turn), "success");
        });

        it('should return success when the guess matches but different case', function () {
            const turn = new Turn("secret")
            turn.guess = "SECRET";
            assert.strictEqual(room._getTurnResult(turn), "success");
        });

        it('should return failure when the guess not matches', function () {
            const turn = new Turn("secret")
            turn.guess = "badguess";
            assert.strictEqual(room._getTurnResult(turn), "failure");
        });

        it('should return skip when the guess is skipped', function () {
            const turn = new Turn("secret")
            turn.guess = "";
            turn.skip = true;
            assert.strictEqual(room._getTurnResult(turn), "skip");
        });
    });

    describe('#calculatePoints()', function () {
        it('should increase the points on success', function () {
            const round = new Round()
            const gameConfig = new GameConfig(3, 1000, 1000, 1000, 3)
            assert.strictEqual(round.points, 0);
            room._calculatePoints('success', round, gameConfig);
            assert.strictEqual(round.points, 1);
        });

        it('should decrease the max number of turns on failure', function () {
            const round = new Round()
            const gameConfig = new GameConfig(3, 1000, 1000, 1000, 3)
            round.points = 2;
            room._calculatePoints('failure', round, gameConfig);
            assert.strictEqual(gameConfig.maxTurn, 2);
        });

        it('should decrease the points on failure when it is the last turn', function () {
            const round = new Round()
            const gameConfig = new GameConfig(3, 1000, 1000, 1000, 3)
            round.points = 2;
            round.currentTurn = gameConfig.maxTurn
            room._calculatePoints('failure', round, gameConfig);
            assert.strictEqual(round.points, 1);
        });

        it('should not decrease the points on failure when it is zero and it is the last turn', function () {
            const round = new Round()
            const gameConfig = new GameConfig(3, 1000, 1000, 1000, 3)
            round.currentTurn = gameConfig.maxTurn
            room._calculatePoints('failure', round, gameConfig);
            assert.strictEqual(round.points, 0);
        });

        it('should not change the max turn on skip', function () {
            const round = new Round()
            round.points = 1
            const gameConfig = new GameConfig(3, 1000, 1000, 1000, 3)
            room._calculatePoints('skip', round, gameConfig);
            assert.strictEqual(gameConfig.maxTurn, 3);
            assert.strictEqual(round.points, 1);
        });

        it('should not change the points on skip when it is the last turn', function () {
            const round = new Round()
            round.points = 1
            const gameConfig = new GameConfig(3, 1000, 1000, 1000, 3)
            round.currentTurn = gameConfig.maxTurn
            room._calculatePoints('skip', round, gameConfig);
            assert.strictEqual(round.points, 1);
            assert.strictEqual(gameConfig.maxTurn, 3);
        });
    });

    describe('#appointNewAdmin()', function () {
        it('should appoint new admin from leftover players when guesser can not be admin', function () {
            const player1 = {id: "1", isGuessing: true, isAdmin: false, playerName: "Player1", isReady: true}
            const player2 = {id: "2", isGuessing: false, isAdmin: false, playerName: "Player2", isReady: true}

            const players: Player[] = [player1, player2]
            room._appointNewAdmin(players)
            assert.strictEqual(player2.isAdmin, true)
        });

        it('should appoint new admin and it should be one before the guesser', function () {
            const player1 = {id: "1", isGuessing: false, isAdmin: false, playerName: "Player1", isReady: true}
            const player2 = {id: "2", isGuessing: true, isAdmin: false, playerName: "Player2", isReady: true}
            const player3 = {id: "3", isGuessing: false, isAdmin: false, playerName: "Player3", isReady: true}

            const players: Player[] = [player1, player2, player3]
            room._appointNewAdmin(players)
            assert.strictEqual(player1.isAdmin, true)
            players.filter(p => p !== player1).forEach(player => {
                assert.strictEqual(player.isAdmin, false)
            })
        });

        it('should appoint new admin when guesser is last one', function () {
            const player1 = {id: "1", isGuessing: false, isAdmin: false, playerName: "Player1", isReady: true}
            const player2 = {id: "2", isGuessing: false, isAdmin: false, playerName: "Player2", isReady: true}
            const player3 = {id: "3", isGuessing: true, isAdmin: false, playerName: "Player3", isReady: true}

            const players: Player[] = [player1, player2, player3]
            room._appointNewAdmin(players)
            assert.strictEqual(player2.isAdmin, true)
            players.filter(p => p !== player2).forEach(player => {
                assert.strictEqual(player.isAdmin, false)
            })
        });
        it('should appoint new admin when guesser is first one', function () {
            const player1 = {id: "1", isGuessing: true, isAdmin: false, playerName: "Player1", isReady: true}
            const player2 = {id: "2", isGuessing: false, isAdmin: false, playerName: "Player2", isReady: true}
            const player3 = {id: "3", isGuessing: false, isAdmin: false, playerName: "Player3", isReady: true}

            const players: Player[] = [player1, player2, player3]
            room._appointNewAdmin(players)
            assert.strictEqual(player2.isAdmin, true)
            players.filter(p => p !== player2).forEach(player => {
                assert.strictEqual(player.isAdmin, false)
            })
        });

    });
});