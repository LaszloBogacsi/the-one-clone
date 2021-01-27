import React from "react";
import styles from './styles.module.css'
interface ButtonProps {
    onClick: (e: any) => void
    children: string
}

export default (props: ButtonProps) => {
    const {onClick, children} = props;
    return (
        <div className={styles.buttonLayerBottom}>
            <div className={styles.buttonLayerMiddle}>
                <button className={styles.button} onClick={onClick}>{children}</button>
            </div>
        </div>
)
}
