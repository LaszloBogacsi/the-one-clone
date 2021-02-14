import React from "react";
import {Player} from "../../domain/Player";
import styles from './styles.module.css';
interface RolesAnnouncementProps {
    me?: Player;
    role?: Player;
    messageText: string
}

export default (props: RolesAnnouncementProps) => {
    const {me, role, messageText} = props;
    const amIInTheRole = me?.id === role?.id;
    const proNoun = amIInTheRole ? 'are' : 'is'

    const announcement = me?.id === role?.id ? "You " : `${role?.name} `
    return (
        <div className={styles.rolesAnnouncement}>
            {role &&
            <h1><span className={`${styles.highlight} ${role.color}`}>{announcement}</span>{proNoun} {messageText}</h1>
            }
        </div>
    )
}