import React, {useReducer} from 'react';
import {act, render, screen} from '@testing-library/react';
import {GameState, GameStateAction, gameStateReducer, Hint, Home2, Player, Round, Turn} from './Home2';

test('can add hints to a turn in a round', () => {
    const hintsExpected: Hint[] = [
        {player: {} as Player, hint: "hint1", duplicate: false},
        {player: {} as Player, hint: "hint2", duplicate: false}
    ]
    const turns: Turn[] = [
        {hints: [], reveal: false, secretWord: "secret", guess: "", result: ""}
    ]
    const rounds: Round[] = [
        {turns, points: 0}
    ]
    const initialState: GameState = {
        rounds,
        maxRound: 0,
        inLobby: true,
        maxTurn: 0,
        hintTimeout: 0,
        guessTimeout: 0,
    };
    const updateAction: GameStateAction = {type: 'addHints', payload: {hints: hintsExpected, roundId: 0, turnId: 0}};
    const updatedState = gameStateReducer(initialState, updateAction);
    expect(updatedState.rounds.length).toEqual(1);
    expect(updatedState.rounds[0].turns.length).toEqual(1);
    expect(updatedState.rounds[0].turns[0].hints).toEqual(hintsExpected);
});
test('can add turn to a round', () => {
    const turn: Turn = {hints: [], reveal: false, secretWord: "secret", guess: "", result: ""}

    const rounds: Round[] = [
        {turns: [], points: 0}
    ]
    const initialState: GameState = {
        rounds,
        maxRound: 0,
        inLobby: true,
        maxTurn: 0,
        hintTimeout: 0,
        guessTimeout: 0,
    };
    const updateAction: GameStateAction = {type: 'addTurn', payload: {turn, roundId: 0}};
    const updatedState = gameStateReducer(initialState, updateAction);
    expect(updatedState.rounds.length).toEqual(1);
    expect(updatedState.rounds[0].turns.length).toEqual(1);
    expect(updatedState.rounds[0].turns[0]).toEqual(turn);
});
