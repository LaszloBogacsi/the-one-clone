import React, {ChangeEvent, useEffect, useState} from 'react';
import './App.css';
import io, {Socket} from 'socket.io-client'
import {BrowserRouter as Router, Route, Switch, useLocation} from 'react-router-dom'

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

function App() {

    return (
        <div className="App">
            <Router>
                <Switch>
                    <Route path={"/"} component={Home}/>
                </Switch>
            </Router>
        </div>
    );
}

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
}

function Home() {
    const [playerName, setPlayerName] = useState("");
    let query = useQuery();
    const [socket, setSocket] = useState<Socket>();
    const [roomId, setRoomId] = useState("09zzt1lym3");
    const [players, setPlayers] = useState<Player[]>();
    const [me, setMe] = useState<Player>();
    const [gameState, setGameState] = useState<GameState>();
    const [hint, setHint] = useState<string>();
    const [guess, setGuess] = useState<string>();
    const [turnResult, setTurnResult] = useState<string>();

    useEffect(() => {
        function toPlayers(playersJoined: any[]) {
            const toPlayer = (player: any) => {
                return {
                    id: player.id,
                    name: player.playerName,
                    isReady: player.isReady,
                    isMe: player.id === socket!.id,
                    isAdmin: player.isAdmin,
                    isGuessing: player.isGuessing
                }
            }
            return playersJoined.map(player => toPlayer(player));
        }

        if (socket) {
            socket.on('connect', () => {
                console.log(socket)
            })
            /* EVENTS to handle
                  - disconnect
                  - connect_error
            */
            socket.on('show-players', (data: { playersJoined: any[] }) => {
                console.log(data)
                setPlayers(toPlayers(data.playersJoined))
                setMe(data.playersJoined.find(player => player.id === socket.id))
            })
            socket.on('start-game', (data: {gameState: GameState}) => {
                console.log(data)
                setGameState(data.gameState)
            })
            socket.on('show-game-state', (data: {gameState: GameState}) => {
                console.log(data)
                setGameState(data.gameState)
            })
            socket.on('reveal-hints', (data: {gameState: GameState}) => {
                console.log(data)
                setGameState(data.gameState)
            })
            socket.on('show-turn-result', (data: {result: string}) => {
                console.log(data)
                setTurnResult(data.result)
            })
        }
        if (players) {
            setMe(players.find(player => player.isMe))
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

    const onGuess = () => {
        socket!.emit('on-player-guess-submit', {guess})
        setGuess("")
    }

    return (
        <div>
            <input value={playerName} onChange={onInputChange} name={"playerName"} type="text" placeholder={"Player Name"}/>
            {/*{roomId ?*/}
            <button onClick={onJoinRoom}>Join Room</button>
            {/*:*/}
            <button onClick={onCreateRoom}>Create Room</button>
            {/*}*/}
            <div>
                Me: {JSON.stringify(me)}
            </div>
            <div>
                {players?.map(player => <li key={player.id}>id: {player.id},
                    name: {player.name} ready?: {player.isReady.toString()}, guessing?: {player.isGuessing.toString()}, hinted?: { gameState ? gameState.rounds[gameState.currentRound].turns[gameState.rounds[gameState.currentRound].currentTurn].hints.some(h => h.player.id === player.id).toString() : "N/A"}</li>)}
            </div>
            <div>
                {me && <button onClick={onReady}>{me.isReady ? 'Not Ready' : 'I\'m Ready'}</button>}
            </div>
            <div>
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
                        <p>I'm hinting here is the secret word: {gameState.rounds[gameState.currentRound].turns[gameState.rounds[gameState.currentRound].currentTurn].secretWord}</p>
                        <input value={hint} onChange={onInputChange} name={"hint"} type="text"/>
                        <button onClick={onHint}>Hint!</button>
                        {turnResult &&
                        <div>
                            {players && players!.find(pl => pl.isGuessing)?.name} guessed {turnResult === 'success' ? 'CORRRECTLY' : 'INCORRECTLY'}
                        </div>
                        }
                    </div>
                }
                {me && me.isGuessing && gameState && gameState.rounds[gameState.currentRound].turns[gameState.rounds[gameState.currentRound].currentTurn].reveal &&
                <div>
                    {gameState.rounds[gameState.currentRound].turns[gameState.rounds[gameState.currentRound].currentTurn].hints.map(hint => <li key={hint.player.id}>{hint.hint}</li>)}
                    <input value={guess} onChange={onInputChange} name={"guess"} type="text"/>
                    <button onClick={onGuess}>Guess!</button>
                    {turnResult &&
                    <div>
                        You guessed {turnResult === 'success' ? 'CORRRECTLY': 'INCORRECTLY'}
                    </div>
                    }
                </div>
                }
            </div>
        </div>
    )
}

export default App;
