import {CountdownType} from "../components/Home/Home2";

type UpdateCountdownAction = { type: 'updateCountdown', payload: { countdown: number, type: CountdownType } }
type ResetCountdownAction = { type: 'resetCountdown'}

export type CountdownAction =
    | UpdateCountdownAction
    | ResetCountdownAction
