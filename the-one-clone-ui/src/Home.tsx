import React, {ChangeEvent, useEffect, useState} from "react";
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
}

interface Round {
    turns: Turn[]
    currentTurn: number
    points: number
}

interface GameState {
    rounds: Round[]
    currentRound: number
    maxRound: number
    hintTimeout: number
    guessTimeout: number
    inLobby: boolean
    maxTurn: number
}


function useQuery() {
    return new URLSearchParams(useLocation().search);
}

export function Home() {
    const [playerName, setPlayerName] = useState("");
    let query = useQuery();
    const [socket, setSocket] = useState<Socket>();
    const [roomId, setRoomId] = useState("09zzt1lym3");
    const [players, setPlayers] = useState<Player[]>([]);
    const [me, setMe] = useState<Player>();
    const [gameState, setGameState] = useState<GameState>();
    const [hint, setHint] = useState<string>();
    const [hintSecond, setHintSecond] = useState<string>();
    const [guess, setGuess] = useState<string>();
    const [turnResult, setTurnResult] = useState<string>();
    const [hintCountdown, setHintCountdown] = useState<number>();
    const [guessCountdown, setGuessCountdown] = useState<number>();

    useEffect(() => {
        if (socket) {
            setMe(players.find(player => player.id === socket.id))
        }
    }, [players])

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
        function toPlayers(playersJoined: any[]): Player[] {

            return playersJoined.map(player => toPlayer(player));
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
            socket.on('start-game', (data: { gameState: GameState }) => {
                console.log(data)
                setGameState(data.gameState)
            })
            socket.on('show-game-state', (data: { gameState: GameState }) => {
                console.log(data)
                setGameState(data.gameState)
            })
            socket.on('reveal-hints', (data: { gameState: GameState }) => {
                console.log(data)
                setGameState(data.gameState)
            })
            socket.on('show-turn-result', (data: { result: string }) => {
                console.log(data)
                setTurnResult(data.result)
            })
            socket.on('hint-countdown', (data: { countdown: number }) => {
                console.log(data)
                setHintCountdown(data.countdown)
                if (guessCountdown !== undefined) setGuessCountdown(undefined)
            })
            socket.on('guess-countdown', (data: { countdown: number }) => {
                console.log(data)
                setGuessCountdown(data.countdown)
                if (hintCountdown !== undefined) setHintCountdown(undefined)
            })
        }

    }, [socket])


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

    const onReady = () => {
        !me?.isReady ? socket!.emit('on-ready') : socket!.emit('on-not-ready')
    }
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
            {gameState &&
            <div>
                <div>
                    {players?.map(player => <li key={player.id}>id: {player.id},
                        name: {player.name} ready?: {player.isReady.toString()},
                        guessing?: {player.isGuessing.toString()},
                        hinted?: {gameState ? gameState.rounds[gameState.currentRound].turns[gameState.rounds[gameState.currentRound].currentTurn].hints.some(h => h.player.id === player.id).toString() : "N/A"}</li>)}
                </div>
                <div>
                    {me && <button onClick={onReady}>{me.isReady ? 'Not Ready' : 'I\'m Ready'}</button>}
                </div>
            </div>

            }
            {gameState && !gameState.inLobby &&
            <div>
                <div>
                    Rounds: {gameState.maxTurn}/{gameState.rounds[gameState.currentRound].currentTurn}
                    Points:{gameState.rounds[gameState.currentRound].points}
                </div>
                {hintCountdown &&
                <div>
                    HintCountdown: {hintCountdown}
                </div>}
                {guessCountdown &&
                <div>
                    GuessCountdown: {guessCountdown}
                </div>}
                {me && gameState && me.isGuessing &&
                <p>I'm guessing</p>
                }
                {gameState &&
                <div>
                    <p>Current Round: {gameState.currentRound}</p>
                    <p>Current Turn: {gameState.rounds[gameState.currentRound].currentTurn}</p>
                </div>
                }

                {me && gameState && !me.isGuessing &&
                <div>
                    <p>I'm hinting here is the secret
                        word: {gameState.rounds[gameState.currentRound].turns[gameState.rounds[gameState.currentRound].currentTurn].secretWord}</p>
                    {!gameState.rounds[gameState.currentRound].turns[gameState.rounds[gameState.currentRound].currentTurn].reveal &&

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

                    {turnResult &&
                    <div>
                        {players && players!.find(pl => pl.isGuessing)?.name} guessed {turnResult === 'success' ? 'CORRRECTLY' : 'INCORRECTLY'}
                    </div>
                    }
                </div>
                }
                {me && me.isGuessing && gameState && gameState.rounds[gameState.currentRound].turns[gameState.rounds[gameState.currentRound].currentTurn].reveal &&
                <div>
                    {gameState.rounds[gameState.currentRound].turns[gameState.rounds[gameState.currentRound].currentTurn].hints.map(hint =>
                        <li key={hint.player.id}>{hint.duplicate ? "duplicate hint" : hint.hint}</li>)}
                    {gameState.rounds[gameState.currentRound].turns[gameState.rounds[gameState.currentRound].currentTurn].hints.length === 0 &&
                    <div>No Hint Submitted</div>
                    }
                    <input value={guess} onChange={onInputChange} name={"guess"} type="text"/>
                    <button onClick={onGuess}>Guess!</button>
                    <button onClick={onSkip}>Skip</button>
                    {turnResult &&
                    <div>
                        You guessed {turnResult === 'success' ? 'CORRECTLY' : 'INCORRECTLY'}
                    </div>
                    }
                </div>
                }
            </div>
            }
        </div>
    )
}