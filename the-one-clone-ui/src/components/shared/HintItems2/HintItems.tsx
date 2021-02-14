import React from "react";
import {Hint} from "../../../domain/Hint";
import styles from './styles.module.css'

interface HintItemProps {
    hints: Hint[];
}

export default (props: HintItemProps) => {
    const {hints} = props;

    return (
        <div className={styles.hintItemsWrapper}>
            <div>Hints</div>
            <div className={styles.hintItems}>
                {hints.map((hint, index) => {
                    return <div className={styles.hintItemContainer}>
                        <div className={`${styles.hintItem} ${hint.duplicate ? styles.duplicate : ""}`} key={index}>
                            {hint.hint}
                        </div>
                    </div>
                })}
            </div>
        </div>
    )
}