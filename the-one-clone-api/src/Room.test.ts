import {Namespace, Socket} from "socket.io";
import {Room2} from "./Room2";
import {Player, PlayerRole} from "./Player";

const sinon = require('sinon')
var assert = require('assert');
const {describe, it} = require("mocha");
describe('Room', function () {

    let room: Room2;
    let player: Player;
    beforeEach(function () {
        room = new Room2({io: {} as any as Namespace, roomId: "", playerName: "", action: "create", socket: {} as any as Socket, wordRepository: {getRandomWord: sinon.spy()}});
        player = {} as Player;
    })

    const guesserPlayer: Player = {id: Math.ceil(Math.random() * 100).toString(), playerName: "Player1", isReady: true, role: PlayerRole.GUESSER}
    const hinterPlayer: Player = {id: Math.ceil(Math.random() * 100).toString(), playerName: "Player2", isReady: true, role: PlayerRole.HINTER}

    describe('#appointNewAdmin()', function () {
        it('should appoint new admin from leftover players when guesser can not be admin', function () {
            const players: Player[] = [{...guesserPlayer}, {...hinterPlayer}]
            room._appointNewAdmin(players)
            assert.strictEqual(players[1].role, PlayerRole.ADMIN_HINTER)
        });

        it('should appoint new admin and it should be one before the guesser', function () {
            const players: Player[] = [{...hinterPlayer}, {...guesserPlayer}, {...hinterPlayer}]
            room._appointNewAdmin(players)
            assert.strictEqual(players[0].role, PlayerRole.ADMIN_HINTER)
            players.filter(p => p !== players[0]).forEach(player => {
                assert.notStrictEqual(player.role, PlayerRole.ADMIN_HINTER)
            })
        });

        it('should appoint new admin when guesser is last one', function () {
            const players: Player[] = [{...hinterPlayer}, {...hinterPlayer}, {...guesserPlayer}]
            room._appointNewAdmin(players)
            assert.strictEqual(players[1].role, PlayerRole.ADMIN_HINTER)
            players.filter(p => p !== players[1]).forEach(player => {
                assert.notStrictEqual(player.role, PlayerRole.ADMIN_HINTER)
            })
        });
        it('should appoint new admin when guesser is first one', function () {
            const players: Player[] = [{...guesserPlayer}, {...hinterPlayer}, {...hinterPlayer}]
            room._appointNewAdmin(players)
            assert.strictEqual(players[1].role, PlayerRole.ADMIN_HINTER)
            players.filter(p => p !== players[1]).forEach(player => {
                assert.notStrictEqual(player.role, PlayerRole.ADMIN_HINTER)
            })
        });

    });
});