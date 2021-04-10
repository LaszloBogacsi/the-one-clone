import React from "react";
import {Hint} from "../../../domain/Hint";
import styles from './styles.module.css'
import {Player} from "../../../domain/Player";

interface HintItemProps {
    hints: Hint[];
    players: Player[]
}

export default (props: HintItemProps) => {
    const {hints, players} = props;

    return (
        <div className={styles.hintItemsWrapper}>
            <h3>Hints</h3>
            <div className={styles.hintItems}>
                {hints.map((hint, index) => {
                    return <div className={styles.hintItemContainer} key={index}>
                        <div className={`${styles.hintItem} ${hint.duplicate ? styles.duplicate : ""} ${players.find(player => hint.player === player.id)?.color || ""}`}>
                            {hint.hint}
                        </div>
                    </div>
                })}
            </div>
        </div>
    )
}