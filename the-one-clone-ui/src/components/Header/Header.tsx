import React, {useMemo} from "react";
import styles from "../Home/styles.module.css";


export default () => {
    const cols = new Map<string, string>([
        ['orange', '#f08100'],
        ['red', '#c80c12'],
        ['pink', '#e6127d'],
        ['purple', '#792a81'],
        ['blue', '#0086c8'],
        ['green', '#42a338'],
        ['yellow', '#f5ae07'],
    ])

    const headerTitle = "THE ONLY ONE CLONE GAME";
    const getRandomColour = (iterable: any) => iterable.get([...iterable.keys()][Math.floor(Math.random() * iterable.size)])

    const generateRandomColors = (headerTitleChars: string[]) => headerTitleChars.map(c => getRandomColour(cols));

    const colors = useMemo(() => generateRandomColors(headerTitle.split("")), [headerTitle])
    return (
        <div className={styles.title}>
            {headerTitle.split("").map((c, index) => c === " " ? " " : <span key={index} style={{color: colors[index]}}>{c}</span>)}
        </div>
    )
}