import React from "react";
import {Hint} from "../../../domain/Hint";
import styles from './styles.module.css'
import {faCheck, faTimes} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import Button from "../Button/Button";
import {Player} from "../../../domain/Player";

interface DedupeHintItemProps {
    hints: Hint[];
    markAsDuplicate: (index: number) => void;
    onSubmit: () => void;
    controlsActive: boolean
    players: Player[]
}

export default (props: DedupeHintItemProps) => {
    const {hints, markAsDuplicate, onSubmit, controlsActive, players} = props;
    const markHintAsDuplicate = (index: number) => markAsDuplicate(index)
    return (
        <div className={styles.hintItemsWrapper}>
            <h3>Hints</h3>
            <div className={styles.description}>Mark Hints as duplicates and exclude them with the <FontAwesomeIcon className={styles.ready} icon={faTimes}/> or include them with the <FontAwesomeIcon className={styles.ready} icon={faCheck}/> button.<br/>
            The hint marked as duplicate will not show up for the guesser. <br/>
                When done submit your choices</div>
            <div className={styles.hintItems}>
                {hints.map((hint, index) =>
                    <div key={index} className={styles.hintItemContainer}>
                        <div className={`${styles.hintItem} ${hint.duplicate ? styles.duplicate : ""} ${players.find(player => hint.player === player.id)?.color || ""}`} key={index}>
                            {hint.hint}
                        </div>
                        {controlsActive && <div className={styles.buttonGroup}>
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
            {controlsActive && <Button onClick={onSubmit} disabled={!hints.length}>Submit</Button>}
        </div>
    )
}