import React from "react";
import {Hint} from "../../../domain/Hint";
import styles from './styles.module.css'
interface HintItemProps {
    hints: Hint[]
}

export default (props: HintItemProps) => {
    const {hints} = props;
    return (
        <div className={styles.hintItemsWrapper}>
            <div>Hints</div>
            <div className={styles.hintItems}>
                {hints.map((hint, index) => <div className={styles.hintItem} key={index}>{hint.hint} {hint.duplicate ? <span>Duplicate</span> : null}</div>)}
            </div>
            </div>
    )
}