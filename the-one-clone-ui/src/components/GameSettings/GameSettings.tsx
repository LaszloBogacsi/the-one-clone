import React, {ChangeEvent} from "react";
import styles from "./styles.module.css";

interface GameSettingsProps {
    hasJoined: boolean;
    gameSettings: {maxRound: number, hintTimeout: number, guessTimeout: number}
    onGameSettingChange: ({key, value}: {key: string, value: number}) => void
}

export default (props: GameSettingsProps) => {
    const {hasJoined, gameSettings: {maxRound, hintTimeout, guessTimeout}, onGameSettingChange} = props;
    const maxRoundOptions = [1, 2, 3, 4, 5, 6, 7];
    const hintTimeoutOptions = [30, 45, 60, 75, 90, 110, 140];
    const guessTimeoutOptions = [30, 45, 60, 75, 90, 110, 140];

    const onChange = (e: ChangeEvent<HTMLSelectElement>) => {
        console.log(e.target.name);
        console.log(e.target.value);
        onGameSettingChange({key: e.target.name, value: +e.target.value})
    }
    return (
        <div className={styles.wrapper}>
            <div className={styles.inset}>
                <h3>Settings</h3>
                <div className={styles.selectors}>
                    <label htmlFor="maxRound">Rounds:</label>
                    <select onChange={onChange} name="maxRound" id="maxRound" disabled={hasJoined}>
                        {maxRoundOptions.map(o => <option selected={o===maxRound} value={o}>{o}</option>)}
                    </select>
                </div>
                <div className={styles.selectors}>
                    <label htmlFor="hintTimeout">Hint Timeout</label>
                    <select onChange={onChange} name="hintTimeout" id="hintTimeout" disabled={hasJoined}>
                        {hintTimeoutOptions.map(o => <option selected={o===hintTimeout} value={o}>{o}</option>)}
                    </select>
                </div>
                <div className={styles.selectors}>
                    <label htmlFor="guessTimeout">Guess Timeout</label>
                    <select onChange={onChange} name="guessTimeout" id="guessTimeout" disabled={hasJoined}>
                        {guessTimeoutOptions.map(o => <option selected={o===guessTimeout} value={o}>{o}</option>)}
                    </select>
                </div>
            </div>
        </div>
    )
}