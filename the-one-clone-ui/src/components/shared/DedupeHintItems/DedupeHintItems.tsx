import React from "react";
import {Hint} from "../../../domain/Hint";
import styles from './styles.module.css'
import {faCheck, faTimes} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import Button from "../Button/Button";

interface HintItemProps {
    hints: Hint[];
    isAdmin: boolean;
    markAsDuplicate: (index: number) => void;
    onSubmit: () => void;
}

export default (props: HintItemProps) => {
    const {hints, isAdmin, markAsDuplicate, onSubmit} = props;
    const markHintAsDuplicate = (index: number) => {
        markAsDuplicate(index);
    }
    return (
        <div className={styles.hintItemsWrapper}>
            <h3>Hints</h3>
            <div className={styles.hintItems}>
                {hints.map((hint, index) =>
                    <div className={styles.hintItemContainer}>
                        <div className={`${styles.hintItem} ${hint.duplicate ? styles.duplicate : ""}`} key={index}>
                            {hint.hint}
                        </div>
                        {isAdmin && <div className={styles.buttonGroup}>
                            <button onClick={() => markHintAsDuplicate(index)} disabled={hint.duplicate}>
                                <FontAwesomeIcon className={!hint.duplicate ? styles.incorrect : ""} icon={faTimes}/>
                            </button>
                            <button onClick={() => markHintAsDuplicate(index)} disabled={!hint.duplicate}>
                                <FontAwesomeIcon className={hint.duplicate ? styles.correct : ""} icon={faCheck}/>
                            </button>
                        </div>}
                    </div>
                )}
            </div>
            {!hints.length &&
                <div className={styles.hintItems}>No hints were submitted</div>
            }
            <Button onClick={onSubmit} disabled={!hints.length}>Submit</Button>
        </div>
    )
}