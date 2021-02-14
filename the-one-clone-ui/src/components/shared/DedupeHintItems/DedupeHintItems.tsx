import React from "react";
import {Hint} from "../../../domain/Hint";
import styles from './styles.module.css'
import {faCheck, faTimes} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

interface HintItemProps {
    hints: Hint[];
    isAdmin: boolean;
    markAsDuplicate: (index: number) => void;
}

export default (props: HintItemProps) => {
    const {hints, isAdmin, markAsDuplicate} = props;
    const markHintAsDuplicate = (index: number) => {
        markAsDuplicate(index);
    }
    return (
        <div className={styles.hintItemsWrapper}>
            <div>Hints</div>
            <div className={styles.hintItems}>
                {hints.map((hint, index) => {
                    return <div className={styles.hintItemContainer}>
                        <div className={`${styles.hintItem} ${hint.duplicate ? styles.duplicate : ""}`} key={index}>
                            {hint.hint}
                        </div>
                        {isAdmin && <div className={styles.buttonGroup}>
                            <button onClick={() => markHintAsDuplicate(index)} disabled={hint.duplicate}><FontAwesomeIcon className={!hint.duplicate ? styles.incorrect : ""} icon={faTimes}/></button>
                            <button onClick={() => markHintAsDuplicate(index)} disabled={!hint.duplicate}><FontAwesomeIcon className={hint.duplicate ? styles.correct : ""} icon={faCheck}/></button>
                        </div>}
                    </div>
                })}
            </div>
        </div>
    )
}