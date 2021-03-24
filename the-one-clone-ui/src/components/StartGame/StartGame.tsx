import React, {ChangeEvent, useCallback, useMemo, useState} from "react";
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
    const onInputChange = (event: ChangeEvent<HTMLInputElement>) => setPlayerName(event.target.value || "")

    const onJoinHandler = () => {
        if (playerName) onJoin(playerName)
    }
    const onCreateHandler = () => {
        if (playerName) onCreate(playerName)
    }

    const join = useCallback(() => roomId !== null, [roomId]);

    return (
        <div className={styles.startGame}>
            <div className={styles.playerNameInputWrapper}>
                <input autoComplete={"off"}
                       className={styles.playerNameInput}
                       value={playerName}
                       onChange={onInputChange}
                       name={"playerName"}
                       type="search"
                       placeholder={"Name"} size={20}/>
            </div>
            {join() ?
                <Button onClick={onJoinHandler}>Join Room</Button>
                :
                <Button onClick={onCreateHandler}>Create Room</Button>
            }
            <div className={styles.wrapper}>
                <h3>Rules/information</h3>
                <p>This is a clone of the Only One game</p>
                <p>Players: 3-7</p>
            </div>
        </div>

    )
}