export type CountdownAction =
    | { type: 'updateCountdown', payload: { countdown: number } }
