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
import Overlay from "../shared/Overlay/Overlay";
import TurnResult from "../TurnResult/TurnResult";
import RoundResult from "../RoundResult/RoundResult";
import '../shared/colors.module.css'
import RolesAnnouncement from "../RolesAnnouncement/RolesAnnouncement";
import Announcement from "../Announcement/Announcement";

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
        results: [],
        showRoles: false,
        announceRound: false,
        announceTurn: false
    };
    const [{
        rounds,
        currentRound,
        inLobby,
        guessTimeout,
        hintTimeout,
        maxRound,
        maxTurn,
        results,
        showRoles,
        announceRound,
        announceTurn,
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
                results: gameState.results,
                showRoles: false,
                announceRound: false,
                announceTurn: false
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
        const startRoundHandler = (data: { round: Round, currentRound: number }) => {
            dispatchGameAction({type: 'addRound', payload: {...data}});
            dispatchGameAction({type: 'announceRound', payload: {announceRound: true}});
        }
        const playerRolesHandler = (data: { guesser: { id: string, name: string } }) => {
            if (me?.id === data.guesser.id) {
                setMe({...me, isGuessing: true})
            }
            dispatchPlayerAction({type: 'updateGuesser', payload: data.guesser})
            dispatchGameAction({type: 'announceRound', payload: {announceRound: false}});
            dispatchGameAction({type: "showRoles", payload: {showRoles: true}})
        };
        const newTurnHandler = (data: { turn: Turn, currentRound: number, currentTurn: number }) => {
            dispatchGameAction({type: "showRoles", payload: {showRoles: false}})
            dispatchGameAction({type: 'addTurn', payload: {...data}});
            dispatchGameAction({type: 'announceTurn', payload: {announceTurn: true}});
        }
        const startTurnHandler = (data: { message: string }) => {
            dispatchGameAction({type: 'announceTurn', payload: {announceTurn: false}});
        }
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
        socket?.on('new-turn', newTurnHandler)
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
            socket?.off('new-turn', newTurnHandler)
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
    const color = () => getRandomColour(cols);
    const mockHints: Hint[] = [
        {duplicate: false, hint: "another hint", player: "1234"},
        {duplicate: false, hint: "a hint", player: "2345"},
    ]
    const mockTurn: Turn = {
        guess: "some guess", hints: mockHints, reveal: true, secretWord: "Secret Word", result: "success"
    }
    const mockPlayers: Player[] = [
        {
            id: "1234",
            isAdmin: true,
            isGuessing: false,
            isMe: false,
            isReady: true,
            name: "Player Hinter Admin",
            color: "blue"
        },
        {
            id: "2345",
            isAdmin: false,
            isGuessing: false,
            isMe: false,
            isReady: true,
            name: "Player Hinter 1",
            color: "purple"
        },
        {
            id: "3456",
            isAdmin: false,
            isGuessing: false,
            isMe: true,
            isReady: true,
            name: "PLayer Hinter 2",
            color: "red"
        },
        {
            id: "4567",
            isAdmin: false,
            isGuessing: true,
            isMe: false,
            isReady: true,
            name: "Player Guesser",
            color: "orange"
        },
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
        isGuessing: false,
        isMe: true,
        isReady: true,
        name: "Me the Great"
    }

    const mockRounds: Round[] = [
        // {currentTurn: 3, points: 13, turns: [mockTurn], showRoundResults: true}
        {currentTurn: 3, points: 13, turns: [], showRoundResults: true}
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
    const mockSettingsInitial: { [key: string]: { useMock: boolean, visible: boolean } } = {
        mockSocket: {useMock: true, visible: false},
        mockLobby: {useMock: true, visible: false},
        mockGame: {useMock: true, visible: true},
        mockPlayerInfo: {useMock: true, visible: true},
        mockPlayerArea: {useMock: true, visible: true},
        mockHinter: {useMock: true, visible: true},
        mockGueser: {useMock: true, visible: false},
        mockTurnResults: {useMock: true, visible: false},
        mockRoundResults: {useMock: true, visible: false},
        mockRolesAnnouncement: {useMock: true, visible: false},
        mockRoundAnnouncement: {useMock: true, visible: false},
        mockTurnAnnouncement: {useMock: true, visible: false},
        mockGameStatus: {useMock: true, visible: true},
        mockTimer: {useMock: true, visible: true},
    }

    const [mockSettings, setMockSettings] = useState(mockSettingsInitial);

    function allMocksHide(settings: any, ...exceptions: string[]) {
        const newMockSettings = {...settings};
        Object.keys(newMockSettings).forEach((key: string) => {
            if (exceptions.includes(key)) {
                newMockSettings[key].useMock = true;
                newMockSettings[key].visible = false;
            }

        })
        return newMockSettings;
    }

    const showLobby = () => setMockSettings({...(allMocksHide(mockSettings, "mockSocket", "mockGame")), mockLobby: {useMock: true, visible: true}})
    const showStart = () => setMockSettings({...(allMocksHide(mockSettings, "mockLobby", "mockGame")), mockSocket: {useMock: true, visible: true}})
    const showGame = () => setMockSettings({...(allMocksHide(mockSettings, "mockSocket", "mockLobby")), mockGame: {useMock: true, visible: true}})
    const playerInfoToggle = () => setMockSettings({...mockSettings, mockPlayerInfo: {useMock: true, visible: !mockSettings.mockPlayerInfo.visible}})
    const playerAreaToggle = () => setMockSettings({...mockSettings, mockPlayerArea: {useMock: true, visible: !mockSettings.mockPlayerArea.visible}})
    const hinterToggle = () => setMockSettings({...mockSettings, mockHinter: {useMock: true, visible: !mockSettings.mockHinter.visible}})
    const guesserToggle = () => setMockSettings({...mockSettings, mockGueser: {useMock: true, visible: !mockSettings.mockGueser.visible}})
    const turnResultsToggle = () => setMockSettings({...mockSettings, mockTurnResults: {useMock: true, visible: !mockSettings.mockTurnResults.visible}})
    const roundResultsToggle = () => setMockSettings({...mockSettings, mockRoundResults: {useMock: true, visible: !mockSettings.mockRoundResults.visible}})
    const roleAnnouncementToggle = () => setMockSettings({...mockSettings, mockRolesAnnouncement: {useMock: true, visible: !mockSettings.mockRolesAnnouncement.visible}})
    const roundAnnouncementToggle = () => setMockSettings({...mockSettings, mockRoundAnnouncement: {useMock: true, visible: !mockSettings.mockRoundAnnouncement.visible}})
    const turnAnnouncementToggle = () => setMockSettings({...mockSettings, mockTurnAnnouncement: {useMock: true, visible: !mockSettings.mockTurnAnnouncement.visible}})
    const gameStatusToggle = () => setMockSettings({...mockSettings, mockGameStatus: {useMock: true, visible: !mockSettings.mockGameStatus.visible}})
    const timerToggle = () => setMockSettings({...mockSettings, mockTimer: {useMock: true, visible: !mockSettings.mockTimer.visible}})
    const getStyle = (key: string) => mockSettings[key].visible ? "green" : "red"
    return (
        <div className={`home ${styles.home}`}>
            <button onClick={showStart}>show start</button>
            <button onClick={showLobby}>show lobby</button>
            <button onClick={showGame}>show game</button>
            {mockSettings.mockGame.visible &&
            <div>
                <button style={{color: getStyle("mockPlayerInfo")}} onClick={playerInfoToggle}>PlayerInfo</button>
                <button style={{color: getStyle("mockPlayerArea")}} onClick={playerAreaToggle}>PlayerArea</button>
                <button style={{color: getStyle("mockHinter")}} onClick={hinterToggle}>Hinter</button>
                <button style={{color: getStyle("mockGueser")}} onClick={guesserToggle}>Guesser</button>
                <button style={{color: getStyle("mockTurnResults")}} onClick={turnResultsToggle}>TurnResult</button>
                <button style={{color: getStyle("mockRoundResults")}} onClick={roundResultsToggle}>RoundResult</button>
                <button style={{color: getStyle("mockRolesAnnouncement")}} onClick={roleAnnouncementToggle}>roleAnnouncement</button>
                <button style={{color: getStyle("mockRoundAnnouncement")}} onClick={roundAnnouncementToggle}>roundAnnouncement</button>
                <button style={{color: getStyle("mockTurnAnnouncement")}} onClick={turnAnnouncementToggle}>turnAnnouncement</button>
                <button style={{color: getStyle("mockGameStatus")}} onClick={gameStatusToggle}>gameStatus</button>
                <button style={{color: getStyle("mockTimer")}} onClick={timerToggle}>timer</button>
            </div>

            }
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
            {(mockSettings.mockSocket.useMock ? mockSettings.mockSocket.visible : !socket) &&
            <div className="init">
                <StartGame onCreate={onCreateRoom} onJoin={onJoinRoom} roomId={query.get("room-id")}/>
            </div>
            }
            {(mockSettings.mockLobby.useMock ? mockSettings.mockLobby.visible : (socket && inLobby)) &&
            <div className="lobby">
                {mockSettings.mockLobby.useMock ?
                    <Lobby {...mockLobbyParams}>
                        {mockResults && mockResults.length > 0 ?
                            <GameResults results={makeResultsWithDescription(mockResults)}/> : null}
                    </Lobby> :
                    <Lobby players={players} me={me} onReady={onReady}>
                        {results && results.length > 0 ?
                            <GameResults results={makeResultsWithDescription(results)}/> : null}
                    </Lobby>
                }
            </div>
            }
            {(mockSettings.mockGame.useMock ? mockSettings.mockGame.visible : (socket && !inLobby)) &&
            <div className="game">
                <div className="playerInfo">
                    {(mockSettings.mockPlayerInfo.useMock ? mockSettings.mockPlayerInfo.visible : mockSettings.mockPlayerInfo.visible) &&
                        <div>
                            {mockSettings.mockPlayerInfo.useMock ?
                                <PlayerInfo players={mockPlayers} turn={mockTurn}/>
                                : <PlayerInfo players={players}
                                              turn={rounds.length > 0 ? rounds[currentRound].turns[rounds[currentRound].currentTurn] : undefined}/>}
                        </div>
                    }
                </div>
                <div className="playArea">
                    {(mockSettings.mockPlayerArea.useMock ? mockSettings.mockPlayerArea.visible : (!inLobby && rounds.length > 0)) &&
                    <div className={styles.playArea}>
                        {(mockSettings.mockHinter.useMock ? mockSettings.mockHinter.visible : (me && !me.isGuessing && rounds.length && rounds[currentRound].turns.length > 0)) &&
                        <div>
                            {mockSettings.mockHinter.useMock ?
                                <Hinter{...mockHinterProps}/>
                                : <Hinter
                                    secretWord={rounds[currentRound].turns[rounds[currentRound].currentTurn].secretWord}
                                    onHint={onHint}
                                    reveal={rounds[currentRound].turns[rounds[currentRound].currentTurn].reveal}
                                    hints={rounds[currentRound].turns[rounds[currentRound].currentTurn].hints}
                                    me={me!}/>
                            }
                        </div>
                        }

                        {(mockSettings.mockGueser.useMock ? mockSettings.mockGueser.visible : (me && me.isGuessing && rounds.length && rounds[currentRound].turns.length > 0)) &&
                        <div>
                            {mockSettings.mockGueser.useMock ?
                                <Guesser{...mockGuesserProps}/>
                                : <Guesser
                                    reveal={rounds[currentRound].turns[rounds[currentRound].currentTurn].reveal}
                                    hints={rounds[currentRound].turns[rounds[currentRound].currentTurn].hints}
                                    onGuess={onGuess}
                                    onSkip={onSkip}
                                    me={me!}/>
                            }
                        </div>

                        }
                        {(mockSettings.mockTurnResults.useMock ? mockSettings.mockTurnResults.visible : (rounds.length && rounds[currentRound].turns.length > 0 && rounds[currentRound].turns[rounds[currentRound].currentTurn].result && !rounds[currentRound].showRoundResults)) &&
                        <Overlay>
                            {mockSettings.mockTurnResults.useMock ?
                                <TurnResult player={mockPlayers.find(player => player.isGuessing)!}
                                            turn={mockTurn}/>
                                : <TurnResult
                                    turn={rounds[currentRound].turns[rounds[currentRound].currentTurn]}
                                    player={players.find(player => player.isGuessing)!}
                                />
                            }
                        </Overlay>
                        }
                        {(mockSettings.mockRoundResults.useMock ? mockSettings.mockRoundResults.visible : (rounds[currentRound].showRoundResults)) &&
                        <Overlay>
                            {mockSettings.mockRoundResults.useMock ?
                                <RoundResult points={mockRounds[0].points}
                                             scoreDescription={scoreDescription(mockRounds[0].points)}/>
                                : <RoundResult points={rounds[currentRound].points}
                                               scoreDescription={scoreDescription(rounds[currentRound].points)}/>
                            }
                        </Overlay>
                        }
                        {(mockSettings.mockRolesAnnouncement.useMock ? mockSettings.mockRolesAnnouncement.visible : showRoles) &&
                        <Overlay>
                            {mockSettings.mockRolesAnnouncement.useMock ?
                                <RolesAnnouncement me={mockPlayers.find(p => p.isMe)}
                                                   guesser={mockPlayers.find(p => p.isGuessing)}/>
                                : <RolesAnnouncement me={me} guesser={players.find(p => p.isGuessing)}/>
                            }
                        </Overlay>
                        }
                        {(mockSettings.mockRoundAnnouncement.useMock ? mockSettings.mockRoundAnnouncement.visible : announceRound) &&
                        <Overlay>
                            {mockSettings.mockRoundAnnouncement.useMock ?
                                <Announcement type={"Round"}
                                              announcement={`${mockGameStatusProps.currentRound}`}/>
                                : <Announcement type={"Round"} announcement={`${currentRound + 1}`}/>
                            }
                        </Overlay>
                        }
                        {(mockSettings.mockTurnAnnouncement.useMock ? mockSettings.mockTurnAnnouncement.visible : announceTurn) &&
                        <Overlay>
                            {mockSettings.mockTurnAnnouncement.useMock ?
                                <Announcement type={"Turn"}
                                              announcement={`${mockGameStatusProps.currentTurn}`}/>
                                : <Announcement type={"Turn"}
                                                announcement={`${rounds[currentRound].currentTurn + 1}`}/>
                            }
                        </Overlay>
                        }
                    </div>

                    }
                </div>
                <div className="gameStatus">
                    {(mockSettings.mockGameStatus.useMock ? mockSettings.mockGameStatus.visible : (!inLobby && rounds.length > 0)) &&
                    <div>
                        {mockSettings.mockGameStatus.useMock ?
                            <GameStatus{...mockGameStatusProps}/>
                            : <GameStatus
                                currentRound={currentRound}
                                currentTurn={rounds[currentRound].currentTurn}
                                maxRounds={maxRound}
                                maxTurns={maxTurn}
                                points={rounds[currentRound].points}
                            />
                        }
                    </div>
                    }
                </div>
                <div className="timer">
                    {(mockSettings.mockTimer.useMock ? mockSettings.mockTimer.visible : mockSettings.mockTimer.visible) &&
                    <div>
                        {mockSettings.mockTimer.useMock ?
                            <Timer timeout={13} critical={10}/>
                            : <Timer timeout={countdown} critical={10}/>
                        }
                    </div>

                    }
                </div>
            </div>
            }
        </div>

    )
}