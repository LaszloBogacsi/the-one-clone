import {CountdownAction} from "./CountdownAction";
import {CountdownState} from "../components/Home/Home2";


export const countdownReducer = (state: CountdownState, action: CountdownAction): CountdownState => {
    switch (action.type) {
        case "resetCountdown":
            return {
                countdown: 0,
                typeStates: []
            }
        case "updateCountdown":
            const {payload} = action
            return {
                countdown: payload.countdown,
                typeStates: state.typeStates.some(ts => ts.type === payload.type) ? state.typeStates.map(ts => {
                    if (ts.type === payload.type) return {type: ts.type, countdown: payload.countdown};
                    return ts;
                }) : [...state.typeStates, payload]
            }
        default:
            throw new Error(`unsupported action type`)
    }
};