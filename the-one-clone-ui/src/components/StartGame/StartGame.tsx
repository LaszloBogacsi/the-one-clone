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
                <div className={styles.inset}>
                    <h3>Settings</h3>
                    <div className={styles.selectors}>
                        <label htmlFor="maxrounds">Rounds:</label>
                        <select name="maxRounds" id="maxrounds" disabled={join()}>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                            <option value="6">6</option>
                            <option value="7">7</option>
                        </select>
                    </div>
                    <div className={styles.selectors}>
                        <label htmlFor="hinttimeout">Hint Timeout</label>
                        <select name="hinttimeout" id="hinttimeout" disabled={join()}>
                            <option value="1">30</option>
                            <option value="2">45</option>
                            <option selected value="3">60</option>
                            <option value="4">75</option>
                            <option value="5">90</option>
                            <option value="6">110</option>
                            <option value="7">140</option>
                        </select>
                    </div>
                    <div className={styles.selectors}>
                        <label htmlFor="guesstimeout">Guess Timeout</label>
                        <select name="guesstimeout" id="guesstimeout" disabled={join()}>
                            <option value="1">30</option>
                            <option value="2">45</option>
                            <option selected value="3">60</option>
                            <option value="4">75</option>
                            <option value="5">90</option>
                            <option value="6">110</option>
                            <option value="7">140</option>
                        </select>
                    </div>
                </div>
            </div>
            <div className={styles.wrapper}>
                <h3>Rules/information</h3>
                <p>This is a clone of the Only One game</p>
                <p>Players: 3-7</p>
            </div>
        </div>

    )
}