import {GameEvent} from "./GameEvent";
import {GameStore} from "./GameStore";
import {Emitter} from "./Emitter";
import Timeout = NodeJS.Timeout;
import {CountdownType} from "./Room2";

export class Countdown implements GameEvent {
    private readonly timeouts: {timeout: Timeout[], interval: Timeout[]} = {timeout: [], interval: []}

    constructor(private readonly emitter: Emitter, private readonly delay: number, private onResolve: (value: (void | PromiseLike<void>)) => void, private readonly type: CountdownType) {
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
        this.onResolve();
    }

    private startCountDown(transition: (value?: void) => void) {
        let countdown = this.delay;
        this._emitCountdown(countdown)
        this.timeouts.interval.push(setInterval(() => {
            countdown -= 1
            this._emitCountdown(countdown)
        }, 1000))
        this.timeouts.timeout.push(setTimeout(() => {
            transition()
        }, (this.delay * 1000) + 1000))
    }

    _emitCountdown(countdown: number) {
        this.emitter.emit('countdown', {countdown, type: this.type})
    }
}