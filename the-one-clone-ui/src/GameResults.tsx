import React from "react";

interface GameResultsProps {
    results: number []
}

export const GameResults = (props: GameResultsProps) => {
    const {results} = props;
    return (
        <div>
            {results.map((result: number, index: number) => <li key={index}>{result}</li>)}
        </div>
    );
};