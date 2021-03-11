import {GameEvent} from "./GameEvent";
import {GameStore} from "./GameStore";
import {Emitter} from "./Emitter";
import Timeout = NodeJS.Timeout;

export class Countdown implements GameEvent {
    private readonly timeouts: {timeout: Timeout[], interval: Timeout[]} = {timeout: [], interval: []}

    constructor(private readonly emitter: Emitter, private readonly delay: number, private onResolve: (value: (void | PromiseLike<void>)) => void) {
    }

    handle(store: GameStore): Promise<void> {
        return new Promise(resolve => {
            this.onResolve = resolve;
            this.startCountDown(resolve)
        });
    }

    cancel(): void {
        this.timeouts.timeout.forEach(clearTimeout);
        this.timeouts.interval.forEach(clearInterval);
    }

    private startCountDown(transition: (value?: void) => void) {
        this.timeouts.timeout.push(setTimeout(() => {
            transition()
        }, this.delay * 1000))
        let countdown = this.delay;
        this._emitCountdown(countdown)
        this.timeouts.interval.push(setInterval(() => {
            countdown -= 1
            this._emitCountdown(countdown)
        }, 1000))
    }

    _emitCountdown(countdown: number) {
        this.emitter.emit('countdown', {countdown})
    }
}