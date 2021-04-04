import React from "react";
import {Turn, TurnResultType} from "../../domain/Turn";
import styles from './styles.module.css'
import {Player} from "../../domain/Player";

interface TurnResultProps {
    turn: Turn
    player?: Player
}

export default (props: TurnResultProps) => {
    const {turn, player} = props;

    return (
        <div className={styles.turnResults}>
            {turn.result === TurnResultType.success &&
            <div>
                <h1 className={styles.correct}>Correct!</h1>
                <div>{player && player.isMe ? "You've" : player && player.name} guessed the word</div>
                <div className={styles.highlight}>{turn.secretWord}</div>
            </div>}
            {turn.result === TurnResultType.skip &&
            <div>
                <h1>Skipped!</h1>
                <div>The word was <span className={styles.highlight}>{turn.secretWord}</span></div>
            </div>
            }
            {turn.result === TurnResultType.failure &&
            <div>
                <h1>Ohh noo...</h1>
                <div>The word was <span className={styles.highlight}>{turn.secretWord}</span></div>
                <div>but {player && player.isMe ? "You've" : player && player.name} guessed <span
                    className={`${styles.incorrect} ${styles.highlight}`}>{turn.guess}</span></div>
            </div>
            }
        </div>
    )
}