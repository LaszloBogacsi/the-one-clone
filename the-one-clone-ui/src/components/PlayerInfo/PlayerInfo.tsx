import React from "react";
import {Player} from "../../domain/Player";
import {Turn} from "../../domain/Turn";
import styles from './styles.module.css'
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCheck, faQuestion, faUser, faUserCog} from "@fortawesome/free-solid-svg-icons";
import {faCommentDots} from "@fortawesome/free-regular-svg-icons";

interface PlayerInfoProps {
    players: Player[]
    turn?: Turn
}

export default (props: PlayerInfoProps) => {
    const {players, turn} = props;
    const hasHinted = (player: Player) => turn!.hints.some(hint => hint.player === player.id && !player.isGuessing)
    return (
        <div className={styles.playerInfo}>
            <ul>
                {players.map((player: Player, index: number) =>
                    <li className={`${styles.playerListItem} ${player.color}`}
                        key={index}>
                        {player.isAdmin ?
                            <FontAwesomeIcon className={player.color} icon={faUserCog}/>
                            : <FontAwesomeIcon className={player.color} icon={faUser}/>
                        }
                        <div className={styles.playerName}>
                            {player.name} {player.isMe && "(me)"}
                        </div>
                        {!player.isGuessing ?
                            ( turn && hasHinted(player) ?
                                    <FontAwesomeIcon className={styles.ready} icon={faCheck}/>
                                    :
                                    <FontAwesomeIcon className={player.color}
                                                     icon={faCommentDots}/>
                            )
                            : <FontAwesomeIcon className={player.color} icon={faQuestion}/>
                        }
                    </li>)}
            </ul>
        </div>
    )
}