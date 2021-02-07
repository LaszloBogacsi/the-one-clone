import React, {ReactNode} from "react";
import styles from './styles.module.css'

interface OverlayProps {
    children: ReactNode
}

export default (props: OverlayProps) => {
    const {children} = props;
    return (
        <div className={styles.overlay}>
            {children}
        </div>
    )
}