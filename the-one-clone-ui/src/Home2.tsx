import React, {ChangeEvent, useEffect, useReducer, useState} from "react";
import io, {Socket} from "socket.io-client";
import {useLocation} from "react-router-dom";

interface Player {
    id: string
    name: string
    isReady: boolean
    isMe: boolean
    isAdmin: boolean
    isGuessing: boolean
}

interface Hint {
    player: Player
    hint: string
    duplicate: boolean
}

interface Turn {
    secretWord: string
    hints: Hint[]
    reveal: boolean
    guess: string
    result: string
}

interface Round {
    turns: Turn[]
    points: number
}

interface GameState {
    rounds: Round[]
    maxRound: number
    inLobby: boolean
    maxTurn: number
    hintTimeout: number
    guessTimeout: number
}

interface CountdownState {
    hintCountdown: number
    guessCountDown: number
}

interface Game {
    gameState: GameState
    players: Player[]
}


function useQuery() {
    return new URLSearchParams(useLocation().search);
}

export function Home2() {
    let query = useQuery();

    const [socket, setSocket] = useState<Socket>();
    const [roomId, setRoomId] = useState("09zzt1lym3");
    const [players, setPlayers] = useState<Player[]>([]);
    const [me, setMe] = useState<Player>();

    // INPUTS
    const [playerName, setPlayerName] = useState("");
    const [hint, setHint] = useState<string>();
    const [hintSecond, setHintSecond] = useState<string>();
    const [guess, setGuess] = useState<string>();
    // const [turnResult, setTurnResult] = useState<string>();
    // const [hintCountdown, setHintCountdown] = useState<number>();
    // const [guessCountdown, setGuessCountdown] = useState<number>();
    type GameStateAction =
        | { type: 'setGameState', payload: GameState }
        | { type: 'setInLobby', payload: boolean  }
        | { type: 'addRound', payload: Round  }
        | { type: 'addTurn', payload: Turn  }




    function gameStateReducer(state: GameState, action: GameStateAction): GameState {
        const {rounds} = state;
        switch (action.type) {
            case "addTurn":
                return {...state, rounds: [...rounds.slice(0, rounds.length-1), {...(rounds[currentRound(rounds)]), turns: [...rounds[currentRound(rounds)].turns, action.payload]}]}
            case "addRound":
                return {...state, rounds: [...rounds, action.payload]}
            case "setInLobby":
                return {...state, inLobby: action.payload};
            case 'setGameState':
                return {...action.payload};
            default:
                throw new Error(`unsupported action type`)
        }
    }

    type PlayerAction =
        | { type: 'updateGuesser', payload: {id: string, name: string}}
    function playersReducer(state: Player[], action: PlayerAction): Player[] {
        switch (action.type) {
            case "updateGuesser":
                return state.map(player => {
                    player.isGuessing = player.id === action.payload.id;
                    return player
                })
            default:
                throw new Error(`unsupported action type`)
        }
    }

    const [{
        rounds,
        inLobby,
        guessTimeout,
        hintTimeout,
        maxRound,
        maxTurn
    }, dispatchGameAction] = useReducer(gameStateReducer, {rounds: [], inLobby: true, guessTimeout: 0, hintTimeout: 0, maxRound: 0, maxTurn:0} as GameState)
    const [state, dispatchPlayerAction] = useReducer(playersReducer, [] as Player[])

    function currentRound(rounds: Round[]): number {
        return rounds.length - 1;
    }

    const currentTurn = (round: Round): number => round.turns.length - 1;

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
                console.log(socket)
            })
            /* EVENTS to handle
                  - connect_error
            */
            // socket.on('show-players', (data: { playersJoined: any[] }) => {
            //     console.log(data)
            //     const playersJoined = data.playersJoined || []
            //     console.log(data.playersJoined)
            //     setPlayers(toPlayers(playersJoined))
            //     setMe(playersJoined.find(player => player.id === socket.id))
            // })

            socket.on('player-joined-lobby', (data: { playerJoined: any }) => {
                console.log(data)
                setPlayers(prevState => [...prevState, toPlayer(data.playerJoined)])
            })
            socket.on('player-ready-change', (data: { id: string, isReady: boolean }) => {
                console.log(data)
                setPlayers(prevState => {
                    return prevState.map(player => {
                        if (player.id === data.id) player.isReady = data.isReady
                        return player
                    })
                })
            })

            socket.on('show-game-state', (data: { gameState: any }) => {
                console.log(data)
                const toGameState = (gameState: any): GameState => {
                    return {
                        guessTimeout: gameState.gameConfig.guessTimeout,
                        hintTimeout: gameState.gameConfig.hintTimeout,
                        maxRound: gameState.gameConfig.maxRound,
                        maxTurn: gameState.gameConfig.maxTurn,
                        inLobby: gameState.inLobby,
                        rounds: gameState.rounds
                    }
                }
                dispatchGameAction({type: "setGameState", payload: toGameState(data.gameState)})
            })

            socket.on('start-game', (data: {inLobby: boolean}) => {
                console.log(data)
                dispatchGameAction({type: 'setInLobby', payload: data.inLobby})
            })
            socket.on('start-round', (data: {round: Round}) => {
                console.log(data)
                dispatchGameAction({type: 'addRound', payload: data.round})
            })
            socket.on('player-roles', (data: {guesser:{id: string, name: string} }) => {
                console.log(data)
                dispatchPlayerAction({type: 'updateGuesser', payload: data.guesser})
            })
            socket.on('start-turn', (data: {turn: Turn}) => {
                console.log(data)
                dispatchGameAction({type: 'addTurn', payload: data.turn})
            })


        }


    }, [socket])

    useEffect(() => {
        if (players) {
            setMe(players.find(player => player.isMe))
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
                        hinted?: {rounds.length && rounds[currentRound(rounds)].turns.length ? rounds[currentRound(rounds)].turns[currentTurn(rounds[currentRound(rounds)])].hints.some(h => h.player.id === player.id).toString() : "N/A"}</li>)}
                </div>
                <div>
                    {me && <button onClick={onReady}>{me.isReady ? 'Not Ready' : 'I\'m Ready'}</button>}
                </div>
            </div>


            {!inLobby && rounds.length > 0 &&
            <div>
                <div>
                    Rounds: {maxTurn}/{currentTurn(rounds[currentRound(rounds)])}
                    Points:{rounds[currentRound(rounds)].points}
                </div>
                {/*{hintCountdown &&*/}
                {/*<div>*/}
                {/*    HintCountdown: {hintCountdown}*/}
                {/*</div>}*/}
                {/*{guessCountdown &&*/}
                {/*<div>*/}
                {/*    GuessCountdown: {guessCountdown}*/}
                {/*</div>}*/}
                {me && me.isGuessing &&
                <p>I'm guessing</p>
                }
                <div>
                    <p>Current Round: {currentRound(rounds)}</p>
                    <p>Current Turn: {currentTurn(rounds[currentRound(rounds)])}</p>
                </div>

                {me && !me.isGuessing && rounds.length && rounds[currentRound(rounds)].turns.length &&
                <div>
                    <p>I'm hinting here is the secret
                        word: {rounds[currentRound(rounds)].turns[currentTurn(rounds[currentRound(rounds)])].secretWord}</p>
                    {!rounds[currentRound(rounds)].turns[currentTurn(rounds[currentRound(rounds)])].reveal &&

                    <div>
                        <input value={hint} onChange={onInputChange} name={"hint"} type="text"/>
                        <button onClick={onHint}>Hint!</button>
                        {players?.length === 3 &&
                        <div>
                            <input value={hintSecond} onChange={onInputChange} name={"hintSecond"} type="text"/>
                            <button onClick={onHintSecond}>Hint!</button>
                        </div>

                        }
                    </div>
                    }

                    {/*{turnResult &&*/}
                    {/*<div>*/}
                    {/*    {players && players!.find(pl => pl.isGuessing)?.name} guessed {turnResult === 'success' ? 'CORRRECTLY' : 'INCORRECTLY'}*/}
                    {/*</div>*/}
                    {/*}*/}
                </div>
                }
                {me && me.isGuessing && rounds[currentRound(rounds)].turns[currentTurn(rounds[currentRound(rounds)])].reveal &&
                <div>
                    {rounds[currentRound(rounds)].turns[currentTurn(rounds[currentRound(rounds)])].hints.map(hint =>
                        <li key={hint.player.id}>{hint.duplicate ? "duplicate hint" : hint.hint}</li>)}
                    {rounds[currentRound(rounds)].turns[currentTurn(rounds[currentRound(rounds)])].hints.length === 0 &&
                    <div>No Hint Submitted</div>
                    }
                    <input value={guess} onChange={onInputChange} name={"guess"} type="text"/>
                    <button onClick={onGuess}>Guess!</button>
                    <button onClick={onSkip}>Skip</button>
                    {/*{turnResult &&*/}
                    {/*<div>*/}
                    {/*    You guessed {turnResult === 'success' ? 'CORRECTLY' : 'INCORRECTLY'}*/}
                    {/*</div>*/}
                    {/*}*/}
                </div>
                }
            </div>
            }
        </div>
    )
}