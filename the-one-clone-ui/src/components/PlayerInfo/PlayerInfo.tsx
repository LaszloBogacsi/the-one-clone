import React from "react";
import {Player} from "../../domain/Player";
import {Turn} from "../../domain/Turn";
import useRandomColor from "../shared/hooks/useRandomColor";
import styles from './styles.module.css'
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCheck, faQuestion, faUser, faUserCog} from "@fortawesome/free-solid-svg-icons";
import {faCommentDots} from "@fortawesome/free-regular-svg-icons";

interface PlayerInfoProps {
    players: Player[]
    turn: Turn
}

export default (props: PlayerInfoProps) => {
    const {players, turn} = props;
    const colorMap = useRandomColor(players.map((p, i) => `playerName${i}`))
    const hasHinted = (player: Player) => turn.hints.some(hint => hint.player === player.id && !player.isGuessing)
    return (
        <div className={styles.playerInfo}>
            <ul>
                {players.map((player: Player, index: number) =>
                    <li className={styles.playerListItem} style={{color: colorMap.get(`playerName${index}`)}}
                        key={index}>
                        {player.isAdmin ?
                            <FontAwesomeIcon style={{color: colorMap.get(`playerName${index}`)}} icon={faUserCog}/>
                            : <FontAwesomeIcon style={{color: colorMap.get(`playerName${index}`)}} icon={faUser}/>
                        }
                        <div className={styles.playerName}>
                            {player.name}
                        </div>
                        {!player.isGuessing ?
                            (hasHinted(player) ?
                                    <FontAwesomeIcon className={styles.ready} icon={faCheck}/>
                                    :
                                    <FontAwesomeIcon style={{color: colorMap.get(`playerName${index}`)}}
                                                     icon={faCommentDots}/>
                            )
                            : <FontAwesomeIcon style={{color: colorMap.get(`playerName${index}`)}} icon={faQuestion}/>
                        }
                    </li>)}
            </ul>
        </div>
    )
}