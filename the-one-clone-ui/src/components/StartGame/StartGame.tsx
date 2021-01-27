import React, {ChangeEvent, useState} from "react";
import Button from "../shared/Button/Button";
import styles from './styles.module.css'

interface StartGameProps {
    onJoin: (name: string) => void
    onCreate: (name: string) => void
}

export function StartGame(props: StartGameProps) {
    const {onJoin, onCreate} = props;
    const [playerName, setPlayerName] = useState("");
    const onInputChange = (event: ChangeEvent<HTMLInputElement>) => setPlayerName(event.target.value || "")

    const onJoinHandler = () => {
        if (playerName) onJoin(playerName)
    }
    const onCreateHandler = () => {
        if (playerName) onCreate(playerName)
    }


    return (
        <div className={styles.startGame}>
            <div className={styles.playerNameInputWrapper}>
                <input autoComplete={"off"}
                       className={styles.playerNameInput}
                       value={playerName}
                       onChange={onInputChange}
                       name={"playerName"}
                       type="search"
                       placeholder={"Player Name"}/>
            </div>

            <Button onClick={onCreateHandler}>Create Room</Button>
            <Button onClick={onJoinHandler}>Join Room</Button>
        </div>

    )
}