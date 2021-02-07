import React from "react";
import styles from './styles.module.css';
interface AnnouncementProps {
    type: string;
    announcement: string;
}

export default (props: AnnouncementProps) => {
    const {type, announcement} = props;
    return (
        <div className={styles.announcement}>
            <div>{type}<span className={styles.highlight}> {announcement}</span></div>
        </div>
    )
}