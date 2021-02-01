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
    return (
        <div className={styles.gameStatus}>
            <div>Round <span className={styles.current}>{currentRound}</span> of {maxRounds}</div>
            <div>Turn <span className={styles.current}>{currentTurn}</span> of {maxTurns}</div>
            <div>Points <span className={styles.current}>{points}</span></div>
        </div>
    )
}