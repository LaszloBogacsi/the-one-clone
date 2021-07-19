import React, {useMemo} from 'react';
import {Hint} from "../../domain/Hint";
import {Turn} from "../../domain/Turn";
import {Round} from "../../domain/Round";
import {GameState} from "../../domain/GameState";
import {gameStateReducer} from "../../reducers/GameStateReducer";
import {GameStateAction} from "../../reducers/GameStateAction";
import {CountdownTypeState} from "./Home2";
import {Segment} from "../ProgressBar/ProgressBar";

test('can add hints to a turn in a round', () => {
    const hintsExpected: Hint[] = [
        {player: "playerId" , hint: "hint1", duplicate: false},
        {player: "playerId2", hint: "hint2", duplicate: false}
    ]
    const turns: Turn[] = [
        {hints: [], reveal: false, secretWord: "secret", guess: "", result: "", deduplication: false}
    ]
    const rounds: Round[] = [
        {turns, points: 0, currentTurn: 0}
    ]

    const initialState: GameState = {
        rounds,
        maxRound: 0,
        inLobby: true,
        maxTurn: 0,
        hintTimeout: 0,
        guessTimeout: 0,
        currentRound: 0,
        results: [],
        showRoles: false,
        announceDeduplication: false,
        announceGameOver: false,
        announceRound: false,
        announceTurn: false,
        announceGuessStart: false
    };
    const updateAction: GameStateAction = {type: 'addHints', payload: {hints: hintsExpected, currentRound: 0, currentTurn: 0}};
    const updatedState = gameStateReducer(initialState, updateAction);
    expect(updatedState.rounds.length).toEqual(1);
    expect(updatedState.rounds[0].turns.length).toEqual(1);
    expect(updatedState.rounds[0].turns[0].hints).toEqual(hintsExpected);
});
test('can add turn to a round', () => {
    const turn: Turn = {hints: [], reveal: false, secretWord: "secret", guess: "", result: "", deduplication: false}

    const rounds: Round[] = [
        {turns: [], points: 0, currentTurn: 0}
    ]
    const initialState: GameState = {
        rounds,
        maxRound: 0,
        inLobby: true,
        maxTurn: 0,
        hintTimeout: 0,
        guessTimeout: 0,
        currentRound: 0,
        results: [],
        showRoles: false,
        announceDeduplication: false,
        announceGameOver: false,
        announceRound: false,
        announceTurn: false,
        announceGuessStart: false
    };
    const updateAction: GameStateAction = {type: 'addTurn', payload: {turn, currentRound: 0, currentTurn: 0}};
    const updatedState = gameStateReducer(initialState, updateAction);
    expect(updatedState.rounds.length).toEqual(1);
    expect(updatedState.rounds[0].turns.length).toEqual(1);
    expect(updatedState.rounds[0].turns[0]).toEqual(turn);
});
test('can update game settings', () => {

    const initialState: GameState = {
        rounds: [],
        maxRound: 0,
        inLobby: true,
        maxTurn: 0,
        hintTimeout: 0,
        guessTimeout: 0,
        currentRound: 0,
        results: [],
        showRoles: false,
        announceDeduplication: false,
        announceGameOver: false,
        announceRound: false,
        announceTurn: false,
        announceGuessStart: false
    };
    const updateAction: GameStateAction = {type: 'updateGameSettings', payload: {maxRound: 2}};
    const updatedState = gameStateReducer(initialState, updateAction);
    expect(updatedState.maxRound).toEqual(2);
    const updateAction2: GameStateAction = {type: 'updateGameSettings', payload: {hintTimeout: 100}};
    const updatedState2 = gameStateReducer(initialState, updateAction2);
    expect(updatedState2.hintTimeout).toEqual(100);
    const updateAction3: GameStateAction = {type: 'updateGameSettings', payload: {guessTimeout: 200}};
    const updatedState3 = gameStateReducer(initialState, updateAction3);
    expect(updatedState3.guessTimeout).toEqual(200);
});

const fromCountdown = (typeStates: CountdownTypeState[], segments: Segment[] ): number[] => {
    const initial = Array(Object.keys(segments).length).fill(0);
    if (!typeStates.length) {
        return initial;
    }

    return typeStates.reduce((acc, ts, i, arr) => {
        if (i > 0 && acc[i - 1] < segments[i-1].maxValue) {
            acc[i-1] = segments[i-1].maxValue;
        }
        acc[i] = segments[i].maxValue - ts.countdown >= 0 ?  segments[i].maxValue - ts.countdown : segments[i].maxValue;
        return acc
    }, initial);
}
const segments = [
    {maxValue: 10, className:  "hintProgress"},
    {maxValue: 20, className:  "dedupeProgress"},
    {maxValue: 30, className:  "guessProgress"}
]
describe('Progress Calculation', ()=>{
    test('empty type state return zero values', () => {
        const numbers = fromCountdown([], segments);
        expect(numbers).toEqual([0, 0, 0])
    })

    test('one type state returns latest', () => {
        const numbers = fromCountdown([{type: "hint", countdown: 1}], segments);
        expect(numbers).toEqual([segments[0].maxValue - 1 , 0, 0])
    })

    test('two type state returns latest', () => {
        const numbers = fromCountdown([{type: "hint", countdown: 1}, {type: "dedupe", countdown: 2}], segments);
        expect(numbers).toEqual([segments[0].maxValue, segments[1].maxValue - 2, 0])
    })

    test('three type state returns latest', () => {
        const numbers = fromCountdown([{type: "hint", countdown: 1}, {type: "dedupe", countdown: 2}, {type: "guess", countdown: 3}], segments);
        expect(numbers).toEqual([segments[0].maxValue, segments[1].maxValue, segments[2].maxValue - 3])
    })

    test('can not be greater than max value', () => {
        const maxValue = 2;
        const numbers = fromCountdown([{type: "hint", countdown: 3}], [...segments.map((s, i) => i === 0 ? {maxValue: maxValue, className: ""}: s)]);
        expect(numbers).toEqual([maxValue, 0, 0])
    })

    test('first must be max when second has a value', () => {
        const numbers = fromCountdown([{type: "hint", countdown: 1}, {type: "dedupe", countdown: 1}], [...segments.map((s, i) => i === 0 ? {maxValue: 2, className: ""}: s)]);
        expect(numbers).toEqual([2, segments[1].maxValue - 1, 0])
    })
})
