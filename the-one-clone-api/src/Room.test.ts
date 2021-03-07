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