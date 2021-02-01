import {CountdownAction} from "./CountdownAction";

export const countdownReducer = (state: number, action: CountdownAction): number => {
    const {type, payload} = action;
    switch (type) {
        case "updateCountdown":
            return payload.countdown
        default:
            throw new Error(`unsupported action type`)
    }
};