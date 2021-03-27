import React, {useEffect, useRef, useState} from "react";
import styles from './styles.module.css'
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCopy} from "@fortawesome/free-regular-svg-icons";
import Button from "../shared/Button/Button";
import {linkSync} from "fs";
import {faCheck} from "@fortawesome/free-solid-svg-icons";

interface LinkShareProps {
    roomId?: string
}

const useHref = () => {
    const [href, setHref] = useState(window.location.href)
    useEffect(() => {
        setHref(window.location.href)
    }, [href])
    return href
}

export default (props: LinkShareProps) => {
    const {roomId} = props;
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [dataUrl, setDataUrl] = useState<string>("");
    const linkText = `${useHref()}?room-id=${roomId}`;
    const [copied, setCopied] = useState(false)
    const onCopy = async () => {
        await navigator.clipboard.writeText(linkText)
        setCopied(true)
    }
    useEffect(() => {
        if (canvasRef.current) {
            const tCtx = canvasRef.current.getContext('2d')!!;
            tCtx.canvas.width = tCtx.measureText(linkText).width;
            tCtx.font = '1.2rem Arial'
            tCtx.fillText(linkText, 0, 15);
            setDataUrl(tCtx.canvas.toDataURL());
        }
    }, [canvasRef.current])

    return (
        <div className={styles.linkShare}>
            <p className={styles.description}>Copy this link and share it with other players</p>
            <div className={styles.layerBottom}>
                <div className={styles.layerMiddle}>

                    <div className={styles.layerTop}>
                        <canvas ref={canvasRef} height={20}/>
                        <img src={dataUrl}/>
                    </div>
                </div>
            </div>
            {!copied ?
                <Button onClick={onCopy}>Copy link<FontAwesomeIcon className={styles.copy} icon={faCopy}/></Button>
                :
                <Button onClick={onCopy}>Copied<FontAwesomeIcon className={styles.copied} icon={faCheck}/></Button>
            }
        </div>

    )
}