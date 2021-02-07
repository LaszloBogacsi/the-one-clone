import React, {ChangeEvent, MouseEvent, useState} from "react";
import styles from './styles.module.css'
import {Hint} from "../../domain/Hint";
import Button from "../shared/Button/Button";
import HintItems from "../shared/HintItems/HintItems";
import {Player} from "../../domain/Player";
interface HinterProps {
    secretWord: string;
    onHint: (event: MouseEvent<HTMLButtonElement>, hint: string) => void;
    reveal: boolean;
    hints: Hint[]
    me: Player
}

export default (props: HinterProps) => {
    const {secretWord, onHint, reveal, hints, me} = props;
    const [hint, setHint] = useState<string>("");
    const onInputChange = (event: ChangeEvent<HTMLInputElement>) => setHint(event.target.value || "")
    return(
        <div className={styles.hinter}>
            <p className={styles.secretWord}>{secretWord}</p>
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
            <Button onClick={(e) => onHint(e, hint)}>Hint!</Button>
            {reveal && <HintItems hints={hints}/>}
        </div>
    )
}