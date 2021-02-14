import React, {ReactElement} from "react";
import styles from './styles.module.css'
interface ButtonProps {
    onClick: (e: any) => void
    children: ReactElement | string
    disabled?: boolean
}

export default (props: ButtonProps) => {
    const {onClick, children, disabled = false} = props;
    return (
        <div className={styles.buttonLayerBottom}>
            <div className={styles.buttonLayerMiddle}>
                <button className={styles.button} onClick={onClick} disabled={disabled}>{children}</button>
            </div>
        </div>
)
}
