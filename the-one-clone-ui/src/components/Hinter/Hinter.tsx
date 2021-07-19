import React, {ChangeEvent, FormEvent, MouseEvent, useState} from "react";
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

    return (
        <div className={styles.hinterContainer}>
            <div className={styles.hinter}>
                <SecretWord word={secretWord}/>
                <Hint onHint={onHint} color={me.color}/>
            </div>
            {isMinPlayerMode &&
            <div className={styles.hinter}>
                <div className={styles.description}>In 3 player mode, Hinters can help with 2 hints</div>
                <Hint onHint={onHint} color={me.color}/>
            </div>}
        </div>
    )
}

interface SecretWordProps {
    word: string
}

const SecretWord = (props: SecretWordProps) => {
    const {word} = props;
    return (
        <div className={styles.secretWordContainer}>
            <div className={styles.descriptionSW}>Secret Word:</div>
            <div className={styles.secretWord}>{word}</div>
        </div>
    )
}

interface HintProps {
    onHint: any
    color?: string
}

const Hint = (props: HintProps) => {
    const [hint, setHint] = useState<string>("");
    const [submitted, setSubmitted] = useState(false)

    const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        setHint(event.target.value || "")
    }
    const onClick = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (hint.trim().length) {
            setSubmitted(true)
            onHint(hint.trim())
        }
    }

    const {onHint, color} = props
    return (
        <form onSubmit={onClick} className={styles.hinter}>
            <div className={styles.hintInput}>
                <input value={hint}
                       autoComplete={"off"}
                       onChange={onInputChange}
                       type="search"
                       placeholder={"Hint Here"}
                       size={20}
                       className={color}
                       disabled={submitted}
                />
            </div>
            <Button disabled={submitted} type={'submit'}>Hint!</Button>
        </form>

    )
}