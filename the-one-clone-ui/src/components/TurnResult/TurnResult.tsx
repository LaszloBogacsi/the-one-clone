import React from "react";
import {Turn} from "../../domain/Turn";
import styles from './styles.module.css'
import {Player} from "../../domain/Player";

interface TurnResultProps {
    turn: Turn
    player: Player
}

export default (props: TurnResultProps) => {
    const {turn, player} = props;
    const isSuccess = turn.result === 'success';
    return (
        <div className={styles.turnResults}>
            {isSuccess ?
                <div>
                    <h1 className={styles.correct}>Correct!</h1>
                    <div>{player.isMe ? "You've" : player.name} guessed the word</div>
                    <div className={styles.highlight}>{turn.secretWord}</div>
                </div>
                :
                <div>
                    <h1>Ohh noo...</h1>
                    <div>The word was <span className={styles.highlight}>{turn.secretWord}</span></div>
                    <div>but {player.isMe ? "You've" : player.name} guessed <span className={`${styles.incorrect} ${styles.highlight}`}>{turn.guess}</span></div>
                </div>

            }
        </div>
    )
}