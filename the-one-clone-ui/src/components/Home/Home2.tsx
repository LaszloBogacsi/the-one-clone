import React, {ChangeEvent, useEffect, useMemo, useReducer, useState} from "react";
import io, {Socket} from "socket.io-client";
import {useLocation} from "react-router-dom";
import {Player} from "../../domain/Player";
import {Hint} from "../../domain/Hint";
import {Turn} from "../../domain/Turn";
import {Round} from "../../domain/Round";
import {GameState} from "../../domain/GameState";
import {gameStateReducer} from "../../reducers/GameStateReducer";
import {playersReducer} from "../../reducers/PlayersReducer";
import {countdownReducer} from "../../reducers/CountdownReducer";
import {StartGame} from "../StartGame/StartGame";
import {Lobby} from "../Lobby/Lobby";
import {GameResults} from "../GameResults/GameResults";
import styles from './styles.module.css'
import PlayerInfo from "../PlayerInfo/PlayerInfo";
import GameStatus from "../GameStatus/GameStatus";
import Timer from "../Timer/Timer";
import Hinter from "../Hinter/Hinter";
import Guesser from "../Guesser/Guesser";
import ResultsOverlay from "../shared/ResultsOverlay/ResultsOverlay";
import TurnResult from "../TurnResult/TurnResult";
import RoundResult from "../RoundResult/RoundResult";
import '../shared/colors.module.css'

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

export interface ScoreDescription {
    title: string;
    description: string
}

export function Home2() {
    let query = useQuery();

    const [socket, setSocket] = useState<Socket>();
    const [roomId, setRoomId] = useState("09zzt1lym3");
    const [me, setMe] = useState<Player>();

    // INPUTS
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

        const playerJoinedHandler = (data: { playerJoined: any }) => {
            dispatchPlayerAction({
                type: 'addPlayer',
                payload: toPlayer(data.playerJoined)
            });
            dispatchPlayerAction({type: "assignColor", payload: [...randomColors]})
        }
        const playerReadyChangeHandler = (data: { id: string, isReady: boolean }) => dispatchPlayerAction({
            type: 'updatePlayerIsReady',
            payload: data
        });
        const showGameStateHandler = (data: { gameState: any }) => {
            const toGameState = (gameState: any): GameState => ({
                guessTimeout: gameState.gameConfig.guessTimeout,
                hintTimeout: gameState.gameConfig.hintTimeout,
                maxRound: gameState.gameConfig.maxRounds,
                maxTurn: gameState.gameConfig.maxTurn,
                inLobby: gameState.inLobby,
                rounds: gameState.rounds,
                currentRound: gameState.currentRound,
                results: gameState.results
            })

            dispatchGameAction({type: "setGameState", payload: toGameState(data.gameState)})
        };
        const lobbyStateHandler = (data: { inLobby: boolean }) => {
            console.log(data)
            dispatchGameAction({
                type: 'setInLobby',
                payload: data.inLobby
            });
        }
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
        const showAllPlayersHandler = (data: { players: any }) => {
            console.log(data)
            dispatchPlayerAction({
                type: 'updateAllPlayers',
                payload: data.players.map(toPlayer)
            });
            dispatchPlayerAction({type: "assignColor", payload: [...randomColors]})
        }
        const gameResultHandler = (data: { results: number[] }) => dispatchGameAction({
            type: 'setGameResult',
            payload: [...data.results]
        });
        const endRoundHandler = (data: { currentRound: number }) => dispatchGameAction({
            type: 'showRoundResult',
            payload: {...data, showRoundResult: true}
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
        socket?.on('end-round', endRoundHandler)
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
            socket?.off('end-round', endRoundHandler)
            socket?.off('end-game', lobbyStateHandler)
            socket?.off('show-all-players', showAllPlayersHandler)
            socket?.off('game-result', gameResultHandler)

        }

    }, [socket, me])

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
    const randomColors = useMemo(() => shuffleArray(colors), [colors.length])
    console.log("random colors");
    console.log(randomColors);

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

    const onHint = (event: any, hint: string) => socket!.emit('on-player-hint-submit', {hint})
    const onHintSecond = () => {
        socket!.emit('on-player-hint-submit', {hint: hintSecond})
        setHintSecond("")
    }

    const onGuess = (event: any, guess: string, skip = false) => {
        socket!.emit('on-player-guess-submit', {guess, skip})
        setGuess("")
    }
    const onSkip = (event: any) => onGuess(event, "", true)

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
    console.log(players);
    const color = () => getRandomColour(cols);
    const mockHints: Hint[] = [
        {duplicate: false, hint: "another hint", player: "1234"},
        {duplicate: false, hint: "a hint", player: "2345"},
    ]
    const mockTurn: Turn = {
        guess: "some guess", hints: mockHints, reveal: true, secretWord: "Secret Word", result: "success"
    }
    const mockPlayers: Player[] = [
        {id: "1234", isAdmin: true, isGuessing: false, isMe: false, isReady: true, name: "Player Hinter Admin"},
        {id: "2345", isAdmin: false, isGuessing: false, isMe: true, isReady: true, name: "Player Hinter 1"},
        {id: "3456", isAdmin: false, isGuessing: false, isMe: false, isReady: true, name: "PLayer Hinter 2"},
        {id: "3456", isAdmin: false, isGuessing: true, isMe: false, isReady: true, name: "Player Guesser"},
    ]

    const mockGameStatusProps = {
        currentRound: 2,
        maxRounds: 5,
        currentTurn: 5,
        maxTurns: 13,
        points: 4
    }

    const mockHinterProps = {
        secretWord: "Big Secret Word",
        onHint: (e: any, hint: string) => console.log(hint),
        reveal: true,
        hints: mockHints,
        me: mockPlayers.find(p => p.isMe)!
    }

    const mockGuesserProps = {
        onGuess: (e: any, hint: string) => console.log(hint),
        onSkip: (e: any) => console.log("SKIPPING"),
        reveal: true,
        hints: mockHints,
        me: mockPlayers.find(p => p.isMe)!,
    }

    const mockMe: Player = {
        id: "playerMe1",
        isAdmin: false,
        isGuessing: true,
        isMe: true,
        isReady: true,
        name: "Me the Great"
    }

    const mockRounds: Round[] = [
        {currentTurn: 3, points: 13, turns: [mockTurn], showRoundResults: true}
    ]

    const mockLobbyParams = {
        players: mockPlayers,
        me: mockMe,
        onReady: () => console.log("ready")
    }

    const mockResults = [
        13,
        12,
        6,
        11
    ]

    const scoreDescription = (score: number): ScoreDescription => {
        const scoreDescriptions = [
            {min: 0, max: 3, title: "Try again...", description: "and again, and again."},
            {min: 4, max: 6, title: "That's a good start.", description: "Try again!"},
            {min: 7, max: 8, title: "You're in the average.", description: "Can you do better?"},
            {min: 9, max: 10, title: "Wow!", description: "Not bad at all."},
            {min: 11, max: 11, title: "Awesome!", description: "That's a score worth celebrating!"},
            {min: 12, max: 12, title: "Incredible!", description: "Your friends must be impressed!"},
            {min: 13, max: 13, title: "Perfect Score!", description: "Can you do it again?"},
        ];
        const defaultDescription = ({title: "Oops...", description: "Whaaattt? That's not possible.."})

        const maybeDescription = scoreDescriptions.find(desc => score >= desc.min && score <= desc.max);
        return maybeDescription ? {
            title: maybeDescription.title,
            description: maybeDescription.description
        } : defaultDescription
    };

    const makeResultsWithDescription = (results: number[]) => {
        return results.map(result => ({...scoreDescription(result), result}))
    }
    //
    // const [counter, setCounter] = useState(10)
    // useEffect(() => {
    //     console.log("interval")
    //     const interval = setInterval(() => {
    //         setCounter(counter -1);
    //     }, 1000)
    //
    //     return () => clearInterval(interval)
    // }, [counter])

    return (
        <div className={`home ${styles.home}`}>
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
                {/*<div className="timer">*/}
                {/*    <Timer*/}
                {/*        // timeout={13}*/}
                {/*        timeout={countdown}*/}
                {/*        // timeout={counter}*/}
                {/*        critical={10}*/}
                {/*    />*/}
                {/*</div>*/}
            </div>
            {!socket &&
            // {!true &&
            <div className="init">
                <StartGame onCreate={onCreateRoom} onJoin={onJoinRoom} roomId={query.get("room-id")}/>
            </div>
            }
            {socket && inLobby &&
            // {true && true &&
            <div className="lobby">
                <Lobby
                    players={players}
                    me={me}
                    onReady={onReady}
                    //{...mockLobbyParams}
                >
                    {results && results.length > 0 ?
                        <GameResults results={makeResultsWithDescription(results)}/> : null}
                    {/*{mockResults && mockResults.length > 0 ? <GameResults results={makeResultsWithDescription(mockResults)}/> : null}*/}
                </Lobby>
            </div>
            }

            {socket && !inLobby &&
            // {true && !true &&
            <div className="game">
                <div className="playerInfo">
                    <PlayerInfo
                        players={players}
                        // players={mockPlayers}
                        turn={rounds.length > 0 ? rounds[currentRound].turns[rounds[currentRound].currentTurn] : undefined}
                        // turn={mockTurn}
                    />
                </div>
                <div className="playArea">
                    {!inLobby && rounds.length > 0 &&
                    // {!false && mockRounds.length > 0 &&
                    <div className={styles.playArea}>
                        {me && !me.isGuessing && rounds.length && rounds[currentRound].turns.length > 0 &&
                        // {mockMe && !mockMe.isGuessing && mockRounds.length && mockRounds[0].turns.length > 0 &&
                        <Hinter
                            secretWord={rounds[currentRound].turns[rounds[currentRound].currentTurn].secretWord}
                            onHint={onHint}
                            reveal={rounds[currentRound].turns[rounds[currentRound].currentTurn].reveal}
                            hints={rounds[currentRound].turns[rounds[currentRound].currentTurn].hints}
                            me={me}
                            //{...mockHinterProps}
                        />
                        }

                        {me && me.isGuessing && rounds.length && rounds[currentRound].turns.length > 0 &&
                        // {mockMe && mockMe.isGuessing && mockRounds.length && mockRounds[0].turns.length > 0 &&
                        <Guesser
                            reveal={rounds[currentRound].turns[rounds[currentRound].currentTurn].reveal}
                            hints={rounds[currentRound].turns[rounds[currentRound].currentTurn].hints}
                            onGuess={onGuess}
                            onSkip={onSkip}
                            me={me}
                            //{...mockGuesserProps}
                        />
                        }
                        {rounds.length && rounds[currentRound].turns.length > 0 && rounds[currentRound].turns[rounds[currentRound].currentTurn].result && !rounds[currentRound].showRoundResults &&
                        // {mockRounds.length && mockRounds[0].turns[0].result && !mockRounds[0].showRoundResults &&
                        <ResultsOverlay>
                            <TurnResult
                                turn={rounds[currentRound].turns[rounds[currentRound].currentTurn]}
                                player={players.find(player => player.isGuessing)!}
                                // player={mockPlayers.find(player => player.isGuessing)!}
                                // turn={mockTurn}
                            />
                        </ResultsOverlay>
                        }
                        {rounds[currentRound].showRoundResults &&
                        // {mockRounds[0].showRoundResults &&
                        <ResultsOverlay>
                            <RoundResult
                                points={rounds[currentRound].points}
                                scoreDescription={scoreDescription(rounds[currentRound].points)}
                                // points={mockRounds[0].points}
                                // scoreDescription={scoreDescription(mockRounds[0].points)}
                            />
                        </ResultsOverlay>
                        }
                    </div>

                    }
                </div>
                <div className="gameStatus">
                    {!inLobby && rounds.length > 0 &&
                    <GameStatus
                        currentRound={currentRound}
                        currentTurn={rounds[currentRound].currentTurn}
                        maxRounds={maxRound}
                        maxTurns={maxTurn}
                        points={rounds[currentRound].points}
                        //{...mockGameStatusProps}
                    />
                    }
                </div>
                <div className="timer">
                    <Timer
                        // timeout={13}
                        timeout={countdown}
                        critical={10}
                    />
                </div>
            </div>
            }
        </div>

    )
}