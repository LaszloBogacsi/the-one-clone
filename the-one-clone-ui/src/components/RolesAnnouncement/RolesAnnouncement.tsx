import React from "react";
import {Player} from "../../domain/Player";
import styles from './styles.module.css';
interface RolesAnnouncementProps {
    me?: Player;
    guesser?: Player;
}

export default (props: RolesAnnouncementProps) => {
    const {me, guesser} = props;
    const amIGuessing = me?.id === guesser?.id;
    const proNoun = amIGuessing ? 'are' : 'is'

    const announcement = me?.id === guesser?.id ? "You " : `${guesser?.name} `
    return (
        <div className={styles.rolesAnnouncement}>
            {guesser &&
            <h1><span className={`${styles.highlight} ${guesser.color}`}>{announcement}</span>{proNoun} guessing</h1>
            }
        </div>
    )
}