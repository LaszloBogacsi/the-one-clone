import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import React, {ReactElement, useCallback} from "react";
import {Player} from "../../domain/Player";
import {faCheck, faTimes, faUser} from "@fortawesome/free-solid-svg-icons";
import styles from './styles.module.css'
import Button from "../shared/Button/Button";

interface LobbyProps {
    players: Player[];
    me?: Player;
    onReady: () => void
    children: ReactElement | null;
    hasJoined: boolean;
    gameSettings: {maxRound: number, hintTimeout: number, guessTimeout: number}
}


export const Lobby = (props: LobbyProps) => {
    const {players, me, onReady, children, hasJoined, gameSettings: {maxRound, hintTimeout, guessTimeout}} = props;
    const maxRoundOptions = [1, 2, 3, 4, 5, 6, 7];
    const hintTimeoutOptions = [30, 45, 60, 75, 90, 110, 140];
    const guessTimeoutOptions = [30, 45, 60, 75, 90, 110, 140];

    return (
        <div className={styles.lobby}>
            {/* GameSettings component*/}
            <div className={styles.wrapper}>
                <div className={styles.inset}>
                    <h3>Settings</h3>
                    <div className={styles.selectors}>
                        <label htmlFor="maxrounds">Rounds:</label>
                        <select name="maxRounds" id="maxrounds" disabled={hasJoined}>
                            {maxRoundOptions.map(o => <option selected={o===maxRound} value={o}>{o}</option>)}
                        </select>
                    </div>
                    <div className={styles.selectors}>
                        <label htmlFor="hinttimeout">Hint Timeout</label>
                        <select name="hinttimeout" id="hinttimeout" disabled={hasJoined}>
                            {hintTimeoutOptions.map(o => <option selected={o===hintTimeout} value={o}>{o}</option>)}
                        </select>
                    </div>
                    <div className={styles.selectors}>
                        <label htmlFor="guesstimeout">Guess Timeout</label>
                        <select name="guesstimeout" id="guesstimeout" disabled={hasJoined}>
                            {guessTimeoutOptions.map(o => <option selected={o===guessTimeout} value={o}>{o}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className={styles.playerList}>
                <ul>
                    {players?.map((player: Player, index: number) =>
                        <li className={styles.playerListItem} key={index}>
                            <FontAwesomeIcon className={player.color} icon={faUser}/>
                            <div className={styles.playerName}>{player.name}</div>
                            <div className={styles.playerStatus}>
                                {player.isReady ?
                                    <FontAwesomeIcon className={styles.ready} icon={faCheck}/>
                                    : <FontAwesomeIcon className={styles.notReady} icon={faTimes}/>
                                }
                            </div>

                        </li>)
                    }
                </ul>
            </div>
            <div className={styles.playerStatusButton}>
                {me &&
                <Button onClick={onReady}>{me.isReady ? 'Not Ready' : 'I\'m Ready'}</Button>
                }
            </div>
            {children}
        </div>
    )
}