import React, {ChangeEvent, useEffect, useReducer, useState} from "react";
import io, {Socket} from "socket.io-client";
import {useLocation} from "react-router-dom";
import {Player} from "./Player";
import {Hint} from "./Hint";
import {Turn} from "./Turn";
import {Round} from "./Round";
import {GameState} from "./GameState";
import {gameStateReducer} from "./GameStateReducer";
import {playersReducer} from "./PlayersReducer";
import {countdownReducer} from "./CountdownReducer";
import {StartGame} from "./components/StartGame/StartGame";
import {Lobby} from "./components/Lobby/Lobby";
import {GameResults} from "./GameResults";
import styles from './styles.module.css'

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

export function Home2() {
    let query = useQuery();

    const [socket, setSocket] = useState<Socket>();
    const [roomId, setRoomId] = useState("09zzt1lym3");
    const [me, setMe] = useState<Player>();

    // INPUTS
    const [hint, setHint] = useState<string>();
    const [hintSecond, setHintSecond] = useState<string>();
    const [guess, setGuess] = useState<string>();

    const initialGameState: GameState = {
        rounds: [],
        currentRound: -1,
        inLobby: true,
        guessTimeout: 0,
        hintTimeout: 0,
        maxRound: 0,
        maxTurn: 0,
        results: []
    };
    const [{
        rounds,
        currentRound,
        inLobby,
        guessTimeout,
        hintTimeout,
        maxRound,
        maxTurn,
        results
    }, dispatchGameAction] = useReducer(gameStateReducer, initialGameState)
    const [players, dispatchPlayerAction] = useReducer(playersReducer, [] as Player[])
    const [countdown, dispatchCountdownAction] = useReducer(countdownReducer, hintTimeout)

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

        const playerJoinedHandler = (data: { playerJoined: any }) => dispatchPlayerAction({
            type: 'addPlayer',
            payload: toPlayer(data.playerJoined)
        });
        const playerReadyChangeHandler = (data: { id: string, isReady: boolean }) => dispatchPlayerAction({
            type: 'updatePlayerIsReady',
            payload: data
        });
        const showGameStateHandler = (data: { gameState: any }) => {
            const toGameState = (gameState: any): GameState => ({
                guessTimeout: gameState.gameConfig.guessTimeout,
                hintTimeout: gameState.gameConfig.hintTimeout,
                maxRound: gameState.gameConfig.maxRound,
                maxTurn: gameState.gameConfig.maxTurn,
                inLobby: gameState.inLobby,
                rounds: gameState.rounds,
                currentRound: gameState.currentRound,
                results: gameState.results
            })

            dispatchGameAction({type: "setGameState", payload: toGameState(data.gameState)})
        };
        const lobbyStateHandler = (data: { inLobby: boolean }) => dispatchGameAction({
            type: 'setInLobby',
            payload: data.inLobby
        });
        const startRoundHandler = (data: { round: Round, currentRound: number }) => dispatchGameAction({
            type: 'addRound',
            payload: {...data}
        });
        const playerRolesHandler = (data: { guesser: { id: string, name: string } }) => {
            console.log(me)
            if (me?.id === data.guesser.id) {
                // setMe(players.find(player => player.id === me.id))
                setMe({...me, isGuessing: true})
            }
            // TODO(do the me thing better)
            dispatchPlayerAction({type: 'updateGuesser', payload: data.guesser})
        };
        const startTurnHandler = (data: { turn: Turn, currentRound: number, currentTurn: number }) => dispatchGameAction({
            type: 'addTurn',
            payload: {...data}
        });
        const countdownHandler = (data: { countdown: number }) => dispatchCountdownAction({
            type: 'updateCountdown',
            payload: {...data}
        });
        const endHintHandler = (data: { message: string }) => {
            console.log(data)
        };
        const turnHintsHandler = (data: { hints: Hint[], currentRound: number, currentTurn: number }) => dispatchGameAction({
            type: 'addHints',
            payload: {...data}
        });
        const turnHintsRevealHandler = (data: { reveal: boolean, currentRound: number, currentTurn: number }) => dispatchGameAction({
            type: 'setTurnHintsReveal',
            payload: {...data}
        });
        const turnResultHandler = (data: { currentRound: number, currentTurn: number, points: number, maxTurn: number, result: string }) => dispatchGameAction({
            type: 'setTurnResult',
            payload: {...data}
        });
        const showAllPlayersHandler = (data: { players: any }) => dispatchPlayerAction({
            type: 'updateAllPlayers',
            payload: data.players.map(toPlayer)
        });
        const gameResultHandler = (data: { results: number[] }) => dispatchGameAction({
            type: 'setGameResult',
            payload: [...data.results]
        });

        socket?.on('connect', () => {
        })
        socket?.on('disconnected', (data: { disconnectedPlayer: any }) => {
            dispatchPlayerAction({type: 'removePlayer', payload: toPlayer(data.disconnectedPlayer)})
        })
        socket?.on('player-joined-lobby', playerJoinedHandler)
        socket?.on('player-ready-change', playerReadyChangeHandler)
        socket?.on('show-game-state', showGameStateHandler)
        socket?.on('start-game', lobbyStateHandler)
        socket?.on('start-round', startRoundHandler)
        socket?.on('player-roles', playerRolesHandler)
        socket?.on('start-turn', startTurnHandler)
        socket?.on('countdown', countdownHandler)
        socket?.on('end-hint', endHintHandler)
        socket?.on('turn-hints', turnHintsHandler)
        socket?.on('turn-hints-reveal', turnHintsRevealHandler)
        socket?.on('turn-result', turnResultHandler)
        socket?.on('end-game', lobbyStateHandler)
        socket?.on('show-all-players', showAllPlayersHandler)
        socket?.on('game-result', gameResultHandler)

        return () => {
            socket?.off('player-joined-lobby', playerJoinedHandler)
            socket?.off('player-ready-change', playerReadyChangeHandler)
            socket?.off('show-game-state', showGameStateHandler)
            socket?.off('start-game', lobbyStateHandler)
            socket?.off('start-round', startRoundHandler)
            socket?.off('player-roles', playerRolesHandler)
            socket?.off('start-turn', startTurnHandler)
            socket?.off('countdown', countdownHandler)
            socket?.off('end-hint', endHintHandler)
            socket?.off('turn-hints', turnHintsHandler)
            socket?.off('turn-hints-reveal', turnHintsRevealHandler)
            socket?.off('turn-result', turnResultHandler)
            socket?.off('end-game', lobbyStateHandler)
            socket?.off('show-all-players', showAllPlayersHandler)
            socket?.off('game-result', gameResultHandler)

        }

    }, [socket, me])

    useEffect(() => {
        if (players.length > 0) {
            const maybeMe = players.find(player => player.isMe);
            if (maybeMe) setMe(maybeMe)
        }
    }, [players])

    // @ts-ignore
    const connectWebsocket = (action: string, playerName: string) => setSocket(io(`ws://localhost:3000`, {
        forceNew: false,
        query: {roomId, playerName, action}
    }));

    // const roomId = query.get("room-id")
    const onJoinRoom = async (playerName: string) => connectWebsocket("join", playerName)
    const onCreateRoom = async (playerName: string) => connectWebsocket("create", playerName)

    const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        switch (event.target.name) {
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
    const onSkip = (event: any) => onGuess(event, true)

    const cols = new Map<string, string>([
        ['orange', '#f08100'],
        ['red', '#c80c12'],
        ['pink', '#e6127d'],
        ['purple', '#792a81'],
        ['blue', '#0086c8'],
        ['green', '#42a338'],
        ['yellow', '#f5ae07'],
    ])

    const getRandomColour = (iterable: any) => iterable.get([...iterable.keys()][Math.floor(Math.random() * iterable.size)])

    const color = () => getRandomColour(cols);
    return (
        <div className={"home"}>
            <div className='header'>
                <div className={styles.title}>
                    <span style={{color: color()}}>T</span><span style={{color: color()}}>H</span><span
                    style={{color: color()}}>E </span>
                    <span style={{color: color()}}>O</span><span style={{color: color()}}>N</span><span
                    style={{color: color()}}>L</span><span style={{color: color()}}>Y </span>
                    <span style={{color: color()}}>O</span><span style={{color: color()}}>N</span><span
                    style={{color: color()}}>E </span>
                    <span style={{color: color()}}>C</span><span style={{color: color()}}>L</span><span
                    style={{color: color()}}>O</span><span style={{color: color()}}>N</span><span
                    style={{color: color()}}>E </span>
                    <span style={{color: color()}}>G</span><span style={{color: color()}}>A</span><span
                    style={{color: color()}}>M</span><span style={{color: color()}}>E</span>
                </div>
            </div>
            {!socket &&
            <div className="init">
                <StartGame onCreate={onCreateRoom} onJoin={onJoinRoom} roomId={query.get("room-id")}/>
            </div>
            }
            {socket && inLobby &&
                <div className="lobby">
                    <Lobby players={players} me={me} onReady={onReady}>
                        {results && results.length > 0 ? <GameResults results={results}/> : null}
                    </Lobby>
                </div>
            }
            {false &&
            <div className="game">
                <div className='header'>THE ONE CLONE game</div>
                <div className="playerInfo">Playerinfo</div>
                <div className="playArea">PlayArea</div>
                <div className="gameStatus">GameStatus</div>
                <div className="timer">Timer</div>

                {/*{false && <div>*/}

                {/*    {!inLobby && rounds.length > 0 &&*/}
                {/*    <div>*/}
                {/*        <div>*/}
                {/*            Rounds: {maxTurn}/{rounds[currentRound].currentTurn}*/}
                {/*            Points:{rounds[currentRound].points}*/}
                {/*        </div>*/}
                {/*        <div>*/}
                {/*            Countdown: {countdown}*/}
                {/*        </div>*/}

                {/*        {me && me.isGuessing &&*/}
                {/*        <p>I'm guessing</p>*/}
                {/*        }*/}
                {/*        <div>*/}
                {/*            <p>Current Round: {currentRound}</p>*/}
                {/*            <p>Current Turn: {rounds[currentRound].currentTurn}</p>*/}
                {/*        </div>*/}

                {/*        {me && !me.isGuessing && rounds.length && rounds[currentRound].turns.length > 0 &&*/}
                {/*        <div>*/}
                {/*            <p>I'm hinting here is the secret*/}
                {/*                word: {rounds[currentRound].turns[rounds[currentRound].currentTurn].secretWord}</p>*/}
                {/*            <div>*/}
                {/*                <input value={hint} onChange={onInputChange} name={"hint"} type="text"/>*/}
                {/*                <button onClick={onHint}>Hint!</button>*/}
                {/*            </div>*/}
                {/*            {rounds[currentRound].turns[rounds[currentRound].currentTurn].reveal &&*/}
                {/*            <div>*/}
                {/*                Hints:*/}
                {/*                {rounds[currentRound].turns[rounds[currentRound].currentTurn].hints.map((hint, index) =>*/}
                {/*                    <li*/}
                {/*                        key={index}>{hint.hint} {hint.duplicate ? <span>Duplicate</span> : null}</li>)}*/}
                {/*            </div>}*/}

                {/*        </div>*/}
                {/*        }*/}
                {/*        {me && me.isGuessing && rounds.length && rounds[currentRound].turns.length > 0 &&*/}
                {/*        <div>*/}
                {/*            {rounds[currentRound].turns[rounds[currentRound].currentTurn].reveal &&*/}
                {/*            <div>*/}
                {/*                <div>*/}
                {/*                    Hints:*/}
                {/*                    {rounds[currentRound].turns[rounds[currentRound].currentTurn].hints.map((hint, index) =>*/}
                {/*                        <li*/}
                {/*                            key={index}>{hint.hint} {hint.duplicate ?*/}
                {/*                            <span>Duplicate</span> : null}</li>)}*/}
                {/*                </div>*/}
                {/*                <div>*/}
                {/*                    <input value={guess} onChange={onInputChange} name={"guess"} type="text"/>*/}
                {/*                    <button onClick={onGuess}>Guess!</button>*/}
                {/*                </div>*/}
                {/*            </div>*/}
                {/*            }*/}

                {/*        </div>*/}
                {/*        }*/}
                {/*    </div>*/}
                {/*    }*/}
                {/*</div>}*/}

            </div>}
        </div>

    )
}