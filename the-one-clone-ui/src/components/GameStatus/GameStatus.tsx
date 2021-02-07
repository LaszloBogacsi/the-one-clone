import React from "react";
import styles from './styles.module.css'

interface GameStatusProps {
    currentRound: number;
    currentTurn: number;
    maxRounds: number;
    maxTurns: number;
    points: number
}

export default (props: GameStatusProps) => {
    const {currentRound, currentTurn, maxRounds, maxTurns, points} = props;
    const plusOne = (n: number) => n + 1;
    return (
        <div className={styles.gameStatus}>
            <div>Round <span className={styles.current}>{plusOne(currentRound)}</span> of {plusOne(maxRounds)}</div>
            <div>Turn <span className={styles.current}>{plusOne(currentTurn)}</span> of {plusOne(maxTurns)}</div>
            <div>Points <span className={styles.current}>{points}</span></div>
        </div>
    )
}