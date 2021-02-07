import React from "react";
import {faTrophy} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import styles from './styles.module.css'

interface GameResultsProps {
    results: {result: number, title: string, description: string}[]
}

export const GameResults = (props: GameResultsProps) => {
    const {results} = props;
    return (
        // <div>
        <table className={styles.gameResults}>
            <thead>
            <tr>
                <th>#</th>
                <th>Score</th>
                <th><FontAwesomeIcon className={styles.trophy} icon={faTrophy}/></th>
            </tr>
            </thead>
            <tbody>
            {results.map((result, index: number) => {
                    return <tr key={index}>
                        <td className={styles.number}>#{index + 1}</td>
                        <td>{result.result}</td>
                        <td>{result.title}</td>
                    </tr>
                }
            )}
            </tbody>

        </table>

        // </div>
    );
};