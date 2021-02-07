import React, {useCallback, useEffect, useMemo, useState} from "react";

const cols = new Map<string, string>([
    ['orange', '#f08100'],
    ['red', '#c80c12'],
    ['pink', '#e6127d'],
    ['purple', '#792a81'],
    ['blue', '#0086c8'],
    ['green', '#42a338'],
    ['yellow', '#f5ae07'],
])

const colors = [
    'orange',
    'red',
    'pink',
    'purple',
    'blue',
    'green',
    'yellow',
]

const getRandomColour = (iterable: any) => iterable.get([...iterable.keys()][Math.floor(Math.random() * iterable.size)])
const shuffleArray = (array: string[]) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

export default (keys: string[]) => {
    const [colorMap, setColorMap] = useState<Map<string, string>>(new Map())
    const assignColors = useCallback(() => keys.forEach(key => {
        if (!colorMap.has(key)) {
            setColorMap(colorMap.set(key, getRandomColour(cols)))
        }
    }), keys);
    assignColors()
    return colorMap
}