import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import React, {ReactElement} from "react";
import {Player} from "../../domain/Player";
import {faCheck, faTimes, faUser} from "@fortawesome/free-solid-svg-icons";
import styles from './styles.module.css'
import Button from "../shared/Button/Button";

interface LobbyProps {
    players: Player[];
    me?: Player;
    onReady: () => void
    children: ReactElement | null;

}


export const Lobby = (props: LobbyProps) => {
    const {players, me, onReady, children} = props;
    const cols = new Map<string, string>([
        ['orange', '#f08100'],
        ['red', '#c80c12'],
        ['pink', '#e6127d'],
        ['purple', '#792a81'],
        ['blue', '#0086c8'],
        ['green', '#42a338'],
        ['yellow', '#f5ae07'],
    ])

    const getRandomColour = (iterable: any) => iterable.get([...iterable.keys()][Math.floor(Math.random() * iterable.size)])

    return (
        <div className={styles.lobby}>
            <div className={styles.playerList}>
                <ul>
                    {players?.map((player: Player, index: number) =>
                        <li className={styles.playerListItem} key={index}>
                            <FontAwesomeIcon style={{color: getRandomColour(cols)}} icon={faUser}/>
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