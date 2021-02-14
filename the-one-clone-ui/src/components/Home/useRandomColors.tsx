import {useMemo, useState} from "react";

const colors = [
    'orange',
    'red',
    'pink',
    'purple',
    'blue',
    'green',
    'yellow',
]
const shuffleArray = (array: string[]) => {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (currentIndex !== 0) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    return array;
}
const randomColorsInitial = useMemo(() => shuffleArray(colors), [colors.length])


export default () => {
    const [randomColors, setRandomColors] = useState(randomColorsInitial)
    return randomColors
}