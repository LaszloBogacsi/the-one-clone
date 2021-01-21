import React, {ChangeEvent, useEffect, useReducer, useState} from "react";
import io, {Socket} from "socket.io-client";
import {useLocation} from "react-router-dom";

export interface Player {
    id: string
    name: string
    isReady: boolean
    isMe: boolean
    isAdmin: boolean
    isGuessing: boolean
}

export interface Hint {
    player: string
    hint: string
    duplicate: boolean
}

export interface Turn {
    secretWord: string
    hints: Hint[]
    reveal: boolean
    guess: string
    result?: string
}

export interface Round {
    turns: Turn[]
    points: number
    currentTurn: number
}

export interface GameState {
    rounds: Round[]
    currentRound: number
    maxRound: number
    inLobby: boolean
    maxTurn: number
    hintTimeout: number
    guessTimeout: number
}


// might not use this
interface Game {
    gameState: GameState
    countdown: number
    players: Player[]
}


function useQuery() {
    return new URLSearchParams(useLocation().search);
}

export type GameStateAction =
    | { type: 'setGameState', payload: GameState }
    | { type: 'setInLobby', payload: boolean }
    | { type: 'addRound', payload: { round: Round, currentRound: number } }
    | { type: 'addTurn', payload: { turn: Turn, currentRound: number, currentTurn: number } }
    | { type: 'addHints', payload: { hints: Hint[], currentRound: number, currentTurn: number } }
    | { type: 'setTurnHintsReveal', payload: { reveal: boolean, currentRound: number, currentTurn: number } }
    | { type: 'setTurnResult', payload: { currentRound: number, currentTurn: number, points: number, maxTurn: number, result: string } }

export function gameStateReducer(state: GameState, action: GameStateAction): GameState {
    const {rounds} = state;
    switch (action.type) {
        case "setTurnResult":
            return {
                ...state,
                rounds: rounds.map((round, index) => {
                    const {currentRound, currentTurn, points, result} = action.payload;
                    if (index === currentRound) {
                        round.points = points;
                        round.turns.map((turn, index) => {
                            if (index === currentTurn) {
                                turn.result = result;
                                return turn;
                            }
                            return turn;
                        })
                    }
                    return round;
                }),
                maxTurn: action.payload.maxTurn
            }
        case "setTurnHintsReveal":
            return {
                ...state, rounds: rounds.map((round, index) => {
                    const {reveal, currentTurn, currentRound} = action.payload;
                    if (index === currentRound) {
                        round.turns.map((turn, index) => {
                            if (index === currentTurn) {
                                turn.reveal = reveal;
                                return turn;
                            }
                            return turn;
                        })
                    }
                    return round;
                })
            }
        case "addHints":
            return {
                ...state, rounds: rounds.map((round, index) => {
                    const {currentTurn, currentRound, hints} = action.payload;
                    if (index === currentRound) {
                        round.turns.map((turn, index) => {
                            if (index === currentTurn) {
                                turn.hints = [...hints];
                                return turn;
                            }
                            return turn;
                        })
                    }
                    return round;
                })
            }

        case "addTurn":
            const {turn, currentRound, currentTurn} = action.payload;
            return {
                ...state,
                rounds: [...rounds.slice(0, currentRound), {
                    ...(rounds[currentRound]),
                    turns: [...rounds[currentRound].turns, turn],
                    currentTurn
                }]
            }
        case "addRound":
            return {...state, rounds: [...rounds, action.payload.round], currentRound: action.payload.currentRound}
        case "setInLobby":
            return {...state, inLobby: action.payload};
        case 'setGameState':
            return {...action.payload};
        default:
            throw new Error(`unsupported action type`)
    }
}

export function Home2() {
    let query = useQuery();

    const [socket, setSocket] = useState<Socket>();
    const [roomId, setRoomId] = useState("09zzt1lym3");
    const [me, setMe] = useState<Player>();

    // INPUTS
    const [playerName, setPlayerName] = useState("");
    const [hint, setHint] = useState<string>();
    const [hintSecond, setHintSecond] = useState<string>();
    const [guess, setGuess] = useState<string>();
    // const [turnResult, setTurnResult] = useState<string>();
    // const [hintCountdown, setHintCountdown] = useState<number>();
    // const [guessCountdown, setGuessCountdown] = useState<number>();


    type PlayerAction =
        | { type: 'updateGuesser', payload: { id: string, name: string } }
        | { type: 'addPlayer', payload: Player }
        | { type: 'updatePlayerIsReady', payload: { id: string, isReady: boolean } }
        | { type: 'removePlayer', payload: Player }

    function playersReducer(state: Player[], action: PlayerAction): Player[] {
        switch (action.type) {
            case "removePlayer":
                return state.filter(player => player.id !== action.payload.id)
            case "updatePlayerIsReady":
                return [...state.map(player => {
                    if (player.id === action.payload.id) {
                        player.isReady = action.payload.isReady
                    }
                    return player
                })]
            case "addPlayer":
                return state.findIndex((player => player.id === action.payload.id)) === -1 ? [...state, action.payload] : state;
            case "updateGuesser":
                return [...state.map(player => {
                    player.isGuessing = false;
                    if (player.id === action.payload.id) {
                        return {...player, isGuessing: true}
                    }
                    return player
                })]
            default:
                throw new Error(`unsupported action type`)
        }
    }

    type CountdownAction =
        | { type: 'updateCountdown', payload: { countdown: number } }

    function countdownReducer(state: number, action: CountdownAction): number {
        const {type, payload} = action;
        switch (type) {
            case "updateCountdown":
                return payload.countdown
            default:
                throw new Error(`unsupported action type`)
        }
    }

    const [{
        rounds,
        currentRound,
        inLobby,
        guessTimeout,
        hintTimeout,
        maxRound,
        maxTurn
    }, dispatchGameAction] = useReducer(gameStateReducer, {
        rounds: [],
        currentRound: -1,
        inLobby: true,
        guessTimeout: 0,
        hintTimeout: 0,
        maxRound: 0,
        maxTurn: 0
    } as GameState)
    const [players, dispatchPlayerAction] = useReducer(playersReducer, [] as Player[])
    const [countdown, dispatchCountdownAction] = useReducer(countdownReducer, hintTimeout)

    function playerRolesListener(data: { guesser: { id: string, name: string } }) {
        console.log(me)
        if (me?.id === data.guesser.id) {
            // setMe(players.find(player => player.id === me.id))
            setMe({...me, isGuessing: true})
        }
        // TODO(do the me thing better)
        dispatchPlayerAction({type: 'updateGuesser', payload: data.guesser})
    }

    useEffect(() => {
        const toPlayer = (player: any): Player => {
            return {
                id: player.id,
                name: player.playerName,
                isReady: player.isReady,
                isMe: player.id === socket!.id,
                isAdmin: player.isAdmin,
                isGuessing: player.isGuessing
            } as Player
        }

        if (socket) {
            socket.on('connect', () => {

            })
            socket.on('disconnected', (data: {disconnectedPlayer: any}) => {
                dispatchPlayerAction({type: 'removePlayer', payload: toPlayer(data.disconnectedPlayer)})
            })

            socket.on('player-joined-lobby', (data: { playerJoined: any }) => {


                dispatchPlayerAction({type: 'addPlayer', payload: toPlayer(data.playerJoined)})
            })
            socket.on('player-ready-change', (data: { id: string, isReady: boolean }) => {

                dispatchPlayerAction({type: 'updatePlayerIsReady', payload: data})
            })

            socket.on('show-game-state', (data: { gameState: any }) => {

                const toGameState = (gameState: any): GameState => ({
                    guessTimeout: gameState.gameConfig.guessTimeout,
                    hintTimeout: gameState.gameConfig.hintTimeout,
                    maxRound: gameState.gameConfig.maxRound,
                    maxTurn: gameState.gameConfig.maxTurn,
                    inLobby: gameState.inLobby,
                    rounds: gameState.rounds,
                    currentRound: gameState.currentRound
                })

                dispatchGameAction({type: "setGameState", payload: toGameState(data.gameState)})
            })

            socket.on('start-game', (data: { inLobby: boolean }) => dispatchGameAction({
                type: 'setInLobby',
                payload: data.inLobby
            }))

            socket.on('start-round', (data: { round: Round, currentRound: number }) => dispatchGameAction({
                type: 'addRound',
                payload: {...data}
            }))

            socket.on('player-roles', playerRolesListener)

            socket.on('start-turn', (data: { turn: Turn, currentRound: number, currentTurn: number }) => dispatchGameAction({
                type: 'addTurn',
                payload: {...data}
            }))

            socket.on('countdown', (data: { countdown: number }) => dispatchCountdownAction({
                type: 'updateCountdown',
                payload: {...data}
            }))

            socket.on('end-hint', (data: { message: string }) => {
                console.log(data)// TODO(Implement this)
            })

            socket.on('turn-hints', (data: { hints: Hint[], currentRound: number, currentTurn: number }) => dispatchGameAction({
                type: 'addHints',
                payload: {...data}
            }))

            socket.on('turn-hints-reveal', (data: { reveal: boolean, currentRound: number, currentTurn: number }) => dispatchGameAction({
                type: 'setTurnHintsReveal',
                payload: {...data}
            }))

            socket.on('turn-result', (data: { currentRound: number, currentTurn: number, points: number, maxTurn: number, result: string }) => dispatchGameAction({
                type: 'setTurnResult',
                payload: {...data}
            }))
        }

    }, [socket, rounds])

    useEffect(() => {
        if (players.length > 0) {
            const maybeMe = players.find(player => player.isMe);
            if (maybeMe) {
                setMe(maybeMe)
            }
        }
    }, [players])


    const connectWebsocket = (action: string) => {
        // @ts-ignore
        setSocket(io(`ws://localhost:3000`, {forceNew: false, query: {roomId, playerName, action}}));
    }

    // const roomId = query.get("room-id")
    const onJoinRoom = async () => {
        const action = "join"
        connectWebsocket(action)
    };

    const onCreateRoom = async () => {
        const action = "create"
        // const roomId = Math.random().toString(36).replace(/[^\w]+/g, '').substr(0, 10)
        // setRoomId(roomId)
        console.log(`roomId: ${roomId}`)
        connectWebsocket(action)
    };

    const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        switch (event.target.name) {
            case "playerName": {
                setPlayerName(event.target.value || "");
                break;
            }
            case "hint": {
                setHint(event.target.value || "");
                break;
            }
            case "hintSecond": {
                setHintSecond(event.target.value || "");
                break;
            }
            case "guess": {
                setGuess(event.target.value || "");
                break;
            }
            default: {
                throw Error("input name not supported: " + event.target.name)
            }
        }

    };

    const onReady = () => socket!.emit('on-ready', {ready: !me?.isReady})

    const onHint = () => {
        socket!.emit('on-player-hint-submit', {hint})
        setHint("")
    }
    const onHintSecond = () => {
        socket!.emit('on-player-hint-submit', {hint: hintSecond})
        setHintSecond("")
    }

    const onGuess = (event: any, skip = false) => {
        socket!.emit('on-player-guess-submit', {guess, skip})
        setGuess("")
    }
    const onSkip = (event: any) => {
        onGuess(event, true)
    }

    return (
        <div>
            <input value={playerName} onChange={onInputChange} name={"playerName"} type="text"
                   placeholder={"Player Name"}/>
            {/*{roomId ?*/}
            <button onClick={onJoinRoom}>Join Room</button>
            {/*:*/}
            <button onClick={onCreateRoom}>Create Room</button>
            {/*}*/}
            <div>
                Me: {JSON.stringify(me)}
            </div>
            <div>
                <div>
                    {players?.map(player => <li key={player.id}>id: {player.id},
                        name: {player.name} ready?: {player.isReady.toString()},
                        guessing?: {player.isGuessing.toString()},
                        hinted?: {rounds.length && rounds[currentRound].turns.length ? rounds[currentRound].turns[rounds[currentRound].currentTurn].hints.some(h => h.player === player.id).toString() : "N/A"}</li>)}
                </div>
                <div>
                    {me && <button onClick={onReady}>{me.isReady ? 'Not Ready' : 'I\'m Ready'}</button>}
                </div>
            </div>


            {!inLobby && rounds.length > 0 &&
            <div>
                <div>
                    Rounds: {maxTurn}/{rounds[currentRound].currentTurn}
                    Points:{rounds[currentRound].points}
                </div>
                <div>
                    Countdown: {countdown}
                </div>

                {me && me.isGuessing &&
                <p>I'm guessing</p>
                }
                <div>
                    <p>Current Round: {currentRound}</p>
                    <p>Current Turn: {rounds[currentRound].currentTurn}</p>
                </div>

                {me && !me.isGuessing && rounds.length && rounds[currentRound].turns.length > 0 &&
                <div>
                    <p>I'm hinting here is the secret
                        word: {rounds[currentRound].turns[rounds[currentRound].currentTurn].secretWord}</p>
                    <div>
                        <input value={hint} onChange={onInputChange} name={"hint"} type="text"/>
                        <button onClick={onHint}>Hint!</button>
                    </div>
                    {rounds[currentRound].turns[rounds[currentRound].currentTurn].reveal &&
                    <div>
                        Hints:
                        {rounds[currentRound].turns[rounds[currentRound].currentTurn].hints.map((hint, index) => <li
                            key={index}>{hint.hint} {hint.duplicate ? <span>Duplicate</span> : null}</li>)}
                    </div>}

                </div>
                }
                {me && me.isGuessing && rounds.length && rounds[currentRound].turns.length > 0 &&
                <div>
                    {rounds[currentRound].turns[rounds[currentRound].currentTurn].reveal &&
                    <div>
                        <div>
                            Hints:
                            {rounds[currentRound].turns[rounds[currentRound].currentTurn].hints.map((hint, index) => <li
                                key={index}>{hint.hint} {hint.duplicate ? <span>Duplicate</span> : null}</li>)}
                        </div>
                        <div>
                            <input value={guess} onChange={onInputChange} name={"guess"} type="text"/>
                            <button onClick={onGuess}>Guess!</button>
                        </div>
                    </div>
                    }

                </div>
                }
            </div>
            }
        </div>
    )
}