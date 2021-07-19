import {CountdownAction} from "./CountdownAction";
import {CountdownState} from "../components/Home/Home2";
import {countdownReducer} from "./CountdownReducer";


const initialState: CountdownState = {
    countdown: 0,
    typeStates: []
}

test('uses payload when empty', () => {
    const action: CountdownAction = {type: "updateCountdown", payload: {type: "hint", countdown: 59}}
    const countdownState = countdownReducer(initialState, action);
    expect(countdownState).toEqual({countdown: 59, typeStates: [{type: "hint", countdown: 59}]})
})

test('updates existing on same type', () => {
    const action: CountdownAction = {type: "updateCountdown", payload: {type: "hint", countdown: 58}}
    const countdownState = countdownReducer({...initialState, typeStates:[{type: "hint", countdown: 59}]}, action);
    expect(countdownState).toEqual({countdown: 58, typeStates: [{type: "hint", countdown: 58}]})
})

test('adds new when not empty', () => {
    const action: CountdownAction = {type: "updateCountdown", payload: {type: "dedupe", countdown: 20}}
    const countdownState = countdownReducer({...initialState, typeStates:[{type: "hint", countdown: 59}]}, action);
    expect(countdownState).toEqual({countdown: 20, typeStates: [{type: "hint", countdown: 59}, {type: "dedupe", countdown: 20}]})
})