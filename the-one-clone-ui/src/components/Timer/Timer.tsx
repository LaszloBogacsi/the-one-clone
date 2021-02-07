import React from "react";
import styles from './styles.module.css'
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faStopwatch, faUserCog} from "@fortawesome/free-solid-svg-icons";

interface TimerProps {
    timeout: number;
    critical: number
}

export default (props: TimerProps) => {
    const {timeout, critical} = props;
    return (
        <div className={styles.timer}>
            <FontAwesomeIcon className={timeout <= critical / 2 ? styles.shake : ""} icon={faStopwatch}/>
            <div className={`${styles.timeout} ${timeout <= critical ? styles.animate: ""}`}>{timeout}</div>
        </div>
    )
}