import React from 'react';
import {Hint} from "../../domain/Hint";
import {Turn} from "../../domain/Turn";
import {Round} from "../../domain/Round";
import {GameState} from "../../domain/GameState";
import {gameStateReducer} from "../../reducers/GameStateReducer";
import {GameStateAction} from "../../reducers/GameStateAction";

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
        announceTurn: false
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
        announceTurn: false
    };
    const updateAction: GameStateAction = {type: 'addTurn', payload: {turn, currentRound: 0, currentTurn: 0}};
    const updatedState = gameStateReducer(initialState, updateAction);
    expect(updatedState.rounds.length).toEqual(1);
    expect(updatedState.rounds[0].turns.length).toEqual(1);
    expect(updatedState.rounds[0].turns[0]).toEqual(turn);
});
