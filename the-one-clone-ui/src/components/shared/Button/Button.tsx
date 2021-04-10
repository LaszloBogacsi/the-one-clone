import React, {ButtonHTMLAttributes, ReactElement, ReactNode} from "react";
import styles from './styles.module.css'
interface ButtonProps {
    children: ReactNode[] | string
    onClick?: (e: any) => void
    disabled?: boolean
    type?: any
}

export default (props: ButtonProps) => {
    const {onClick, children, disabled = false, type = 'button'} = props;
    return (
        <div className={styles.buttonLayerBottom}>
            <div className={styles.buttonLayerMiddle}>
                <button className={styles.button} onClick={onClick} disabled={disabled} type={type}>{children}</button>
            </div>
        </div>
)
}
