import React from "react";
import styles from './styles.module.css'

export interface Segment {
    maxValue: number;
    className: string
}

interface ProgressBarProps {
    segments: Segment[];
    currentValues: number[];
}

export const ProgressBar = (props: ProgressBarProps) => {
    const {segments, currentValues} = props;
    const baseValue = segments[0].maxValue;
    const template = segments.map(config => config.maxValue / baseValue).join("fr ").concat("fr")
    return (
        <div className={styles.progressBar} style={{gridTemplateColumns: template}}>
            {segments.map((segment, index) => {
                const width = `${Math.min((currentValues[index] / segment.maxValue), 1) * 100}%`;
                return (
                    <div key={index} className={styles.segmentWrapper}>
                        <div className={styles[segment.className]} style={{width: width}}/>
                    </div>)
            })}
        </div>
    )
}