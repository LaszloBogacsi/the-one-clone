import {GameEvent} from "./GameEvent";
import {GameStore} from "./GameStore";
import {Emitter} from "./Emitter";
import Timeout = NodeJS.Timeout;

export class Countdown implements GameEvent {
    constructor(private readonly emitter: Emitter, private readonly delay: number, private onResolve: (value: (void | PromiseLike<void>)) => void) {
    }

    handle(store: GameStore): Promise<void> {
        return new Promise(resolve => {
            this.onResolve = resolve;
            this.startCountDown(store, resolve)
        });
    }

    private startCountDown(store: GameStore, transition: (value?: void) => void) {
        store.countDownTimeout = setTimeout(() => {
            transition()
        }, this.delay * 1000)
        let countdown = this.delay;
        this._emitCountdown(countdown)
        store.countDownInterval = setInterval(() => {
            countdown -= 1
            this._emitCountdown(countdown)
        }, 1000)
    }

    _emitCountdown(countdown: number) {
        this.emitter.emit('countdown', {countdown})
    }

}