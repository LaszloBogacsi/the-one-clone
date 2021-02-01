import React from "react";
import styles from './styles.module.css'
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faStopwatch, faUserCog} from "@fortawesome/free-solid-svg-icons";

interface TimerProps {
    timeout: number;
}

export default (props: TimerProps) => {
    const {timeout} = props;
    return (
        <div className={styles.timer}>
            <div>
                <FontAwesomeIcon icon={faStopwatch}/>
                {timeout}</div>
        </div>
    )
}