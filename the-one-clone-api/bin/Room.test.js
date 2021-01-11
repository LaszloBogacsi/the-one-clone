var assert = require('assert');
const Room = require("./Room");
const {describe, it} = require("mocha");
describe('Room', function() {
    const room = new Room({io: {}, roomId: "", playerName: "", action: "", socket: {}})
    describe('#markDuplicates()', function() {
        it('should not mark items as duplicate when only one item present', function() {
            const hints = [
                {hint: "a", duplicate: false},
            ]
            const expectedHints = [
                {hint: "a", duplicate: false},
            ]
            room.markDuplicates(hints)
            assert.deepStrictEqual(hints, expectedHints);
        });
        it('should mark all duplicate items when all items are duplicates', function() {
            const hints = [
                {hint: "a", duplicate: false},
                {hint: "a", duplicate: false}
            ]
            const expectedHints = [
                {hint: "a", duplicate: true},
                {hint: "a", duplicate: true}
            ]
            room.markDuplicates(hints)
            assert.deepStrictEqual(hints, expectedHints);
        });
        it('should mark all duplicate items', function() {
            const hints = [
                {hint: "a", duplicate: false},
                {hint: "b", duplicate: false},
                {hint: "a", duplicate: false}
            ]
            const expectedHints = [
                {hint: "a", duplicate: true},
                {hint: "a", duplicate: true},
                {hint: "b", duplicate: false},
            ]
            room.markDuplicates(hints)
            assert.deepStrictEqual(hints, expectedHints);
        });
    });
});