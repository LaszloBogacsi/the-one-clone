import React, {ChangeEvent, MouseEvent, useState} from "react";
import styles from './styles.module.css'
import {Hint} from "../../domain/Hint";
import Button from "../shared/Button/Button";
interface HinterProps {
    secretWord: string;
    onHint: (event: MouseEvent<HTMLButtonElement>, hint: string) => void;
    reveal: boolean;
    hints: Hint[]
}

export default (props: HinterProps) => {
    const {secretWord, onHint, reveal, hints} = props;
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
                       size={20}/>
            </div>
            <Button onClick={(e) => onHint(e, hint)}>Hint!</Button>
            {reveal &&
            <div>
                Hints:
                {hints.map((hint, index) =>
                    <li
                        key={index}>{hint.hint} {hint.duplicate ? <span>Duplicate</span> : null}</li>)}
            </div>}
        </div>
    )
}