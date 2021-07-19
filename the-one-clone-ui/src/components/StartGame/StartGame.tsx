import React, {ChangeEvent, FormEvent, useCallback, useMemo, useState} from "react";
import Button from "../shared/Button/Button";
import styles from './styles.module.css'

interface StartGameProps {
    onJoin: (name: string) => void
    onCreate: (name: string) => void
    roomId: string | null
}

export function StartGame(props: StartGameProps) {
    const {onJoin, onCreate, roomId} = props;
    const [playerName, setPlayerName] = useState("");
    const [submitted, setSubmitted] = useState(false)
    const onInputChange = (event: ChangeEvent<HTMLInputElement>) => setPlayerName(event.target.value || "")
    const onsubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        e.stopPropagation();
        join() ? onJoinHandler() : onCreateHandler()
    }
    const onJoinHandler = () => {
        if (playerName) {
            onJoin(playerName)
            setSubmitted(true)

        }
    }
    const onCreateHandler = () => {
        if (playerName) {
            onCreate(playerName)
            setSubmitted(true)
        }
    }

    const join = useCallback(() => roomId !== null, [roomId]);

    return (
        <div className={styles.startGame}>
            <form onSubmit={onsubmit} className={styles.startGame}>
                <div className={styles.playerNameInputWrapper}>
                    <input autoComplete={"off"}
                           className={styles.playerNameInput}
                           value={playerName}
                           onChange={onInputChange}
                           name={"playerName"}
                           type="search"
                           placeholder={"Name"} size={20}
                           disabled={submitted}/>
                </div>
                <Button disabled={submitted} type={'submit'}>{join() ? "Join Room" : "Create Room"}</Button>
            </form>
            <div className={styles.wrapper}>
                <h3>Rules/information</h3>
                <p>This is a clone of the Just One game</p>
                <p>Players: 3-7</p>
            </div>
        </div>

    )
}