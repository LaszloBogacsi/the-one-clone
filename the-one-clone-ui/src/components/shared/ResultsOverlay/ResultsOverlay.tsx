import React, {ReactNode} from "react";
import styles from './styles.module.css'

interface ResultsOverlayProps {
    children: ReactNode
}

export default (props: ResultsOverlayProps) => {
    const {children} = props;
    return (
        <div className={styles.resultOverlay}>
            {children}
        </div>
    )
}