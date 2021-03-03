import React, {ChangeEvent, MouseEvent, useState} from "react";
import styles from './styles.module.css'
import Button from "../shared/Button/Button";
import {Player} from "../../domain/Player";
interface HinterProps {
    secretWord: string;
    onHint: (hint: string) => void;
    me: Player
    isMinPlayerMode: boolean
}

export default (props: HinterProps) => {
    const {secretWord, onHint, me, isMinPlayerMode} = props;
    const [hint, setHint] = useState<string>("");
    const [hint2, setHint2] = useState<string>("");
    const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        switch (event.target.name) {
            case "hint":
                setHint(event.target.value || "")
                break;
            case "hint2":
                setHint2(event.target.value || "")
                break;
        }
    }
    return(
        <div className={styles.hinter}>
            <p className={styles.secretWord}>{secretWord}</p>
            <div className={styles.description}>In 3 player mode, Hinters can help with 2 hints</div>
            <div className={styles.hintInput}>
                <input value={hint}
                       autoComplete={"off"}
                       onChange={onInputChange}
                       name={"hint"}
                       type="search"
                       placeholder={"Hint Me"}
                       size={20}
                       className={me.color}
                />
            </div>
            <Button onClick={() => onHint(hint)}>Hint!</Button>

            {isMinPlayerMode &&
            <div className={styles.hinter}>
                <div className={styles.hintInput}>
                    <input value={hint2}
                           autoComplete={"off"}
                           onChange={onInputChange}
                           name={"hint2"}
                           type="search"
                           placeholder={"Hint Me"}
                           size={20}
                           className={me.color}
                    />
                </div>
                <Button onClick={() => onHint(hint)}>Hint!</Button>
            </div>
            }
        </div>

    )
}