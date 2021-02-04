import React, {ChangeEvent, MouseEvent, useState} from "react";
import styles from './styles.module.css'
import {Hint} from "../../domain/Hint";
import Button from "../shared/Button/Button";
import {faCheck} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCommentDots} from "@fortawesome/free-regular-svg-icons";
import HintItems from "../shared/HintItems/HintItems";
interface GuesserProps {
    onGuess: (event: MouseEvent<HTMLButtonElement>, hint: string) => void;
    onSkip: (event: MouseEvent<HTMLButtonElement>) => void;
    reveal: boolean;
    hints: Hint[]
}

export default (props: GuesserProps) => {
    const {onGuess, onSkip, reveal, hints} = props;
    const [guess, setGuess] = useState<string>("");
    const [submitted, setSubmitted] = useState(false)
    const onInputChange = (event: ChangeEvent<HTMLInputElement>) => setGuess(event.target.value || "")
    const onButtonPress = (cb: any) => {
        cb()
        setSubmitted(true)
    }
    return(
        reveal ?
        <div className={styles.guesser}>

            <HintItems hints={hints}/>
            <div className={styles.guessInput}>
                <input value={guess}
                       autoComplete={"off"}
                       onChange={onInputChange}
                       name={"guess"}
                       type="search"
                       placeholder={"Guess Me"}
                       size={20}
                       disabled={submitted}
                />
            </div>
            <Button disabled={submitted} onClick={(e) => onButtonPress(() => onGuess(e, guess))}>Guess!</Button>
            <Button disabled={submitted} onClick={() => onButtonPress(onSkip)}>Skip!</Button>
        </div>
            :
            <div className={styles.guesser}>
                <p>You are <span className={styles.guessing}>Guessing</span><br/>
                Wait until everyone submits a hint... <br/>
                the hints will appear here</p>
                <div className={styles.description}>Players with <FontAwesomeIcon className={styles.ready} icon={faCheck}/> are ready while others with the <FontAwesomeIcon className={styles.ready} icon={faCommentDots}/> symbol are still thinking</div>
            </div>
    )
}