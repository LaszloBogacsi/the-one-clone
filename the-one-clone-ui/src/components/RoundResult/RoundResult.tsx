import React from "react";
import styles from './styles.module.css'
import {ScoreDescription} from "../Home/Home2";

interface RoundResultProps {
    points: number;
    scoreDescription: ScoreDescription
}

export default (props: RoundResultProps) => {
    const {points, scoreDescription} = props;

    return (
        <div className={styles.roundResults}>
            <h1>{scoreDescription.title}</h1>
            <div>You've collected <span className={styles.highlight}>{points}</span> points</div>
            <div className={styles.description}>{scoreDescription.description}</div>
        </div>
    )
}