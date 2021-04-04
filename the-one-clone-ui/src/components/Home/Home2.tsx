import React, {useEffect, useReducer, useState} from "react";
import io, {Socket} from "socket.io-client";
import {useLocation} from "react-router-dom";
import {Player} from "../../domain/Player";
import {Hint} from "../../domain/Hint";
import {Turn} from "../../domain/Turn";
import {Round} from "../../domain/Round";
import {GameState} from "../../domain/GameState";
import {gameStateReducer, initialGameState} from "../../reducers/GameStateReducer";
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
import Header from "../Header/Header";
import DedupeHintItems from "../shared/DedupeHintItems/DedupeHintItems";
import useRandomColors from "./useRandomColors";
import LinkShare from "../LinkShare/LinkShare";
import {MockHome} from "./MockHome";

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

export interface ScoreDescription {
    title: string;
    description: string
}

export function Home2() {
    const query = useQuery();
    const minPlayersNumber = 2;

    const [socket, setSocket] = useState<Socket>();
    const initialRoomId = Math.random().toString(36).replace(/[^\w]+/g, '').substr(0, 10)

    const [roomId, setRoomId] = useState(initialRoomId);
    const [me, setMe] = useState<Player>();

    // INPUTS
    const randomColors = useRandomColors();

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
        announceGameOver,
        announceDeduplication,
        announceGuessStart
    }, dispatchGameAction] = useReducer(gameStateReducer, initialGameState)
    const [players, dispatchPlayerAction] = useReducer(playersReducer, [] as Player[])
    const [countdown, dispatchCountdownAction] = useReducer(countdownReducer, hintTimeout)

    useEffect(() => {
        console.log(query.get("room-id"))

        if (query.get("room-id") !== null) {
            setRoomId(query.get("room-id")!)
        }
    }, [])

    useEffect(() => {
        const toPlayer = (player: any): Player => {
            return {
                id: player.id,
                name: player.playerName,
                isReady: player.isReady,
                isMe: player.id === socket!.id,
                isAdmin: player.role === "admin-hinter",
                isGuessing: player.role === "guesser"
            }
        }

        const playerJoinedHandler = (data: { playerJoined: any }) => {
            dispatchPlayerAction({
                type: 'addPlayer',
                payload: toPlayer(data.playerJoined)
            });
            dispatchPlayerAction({type: "assignColor", payload: [...randomColors]})
        }

        const gameSettingsUpdateHandler = (data: { [key: string]: number }) => {
            dispatchGameAction({type: 'updateGameSettings', payload: {...data}});

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
                announceTurn: false,
                announceGameOver: false,
                announceDeduplication: false,
                announceGuessStart: false,
            })

            dispatchGameAction({type: "setGameState", payload: toGameState(data.gameState)})
        };
        const lobbyStateHandler = (data: { inLobby: boolean }) => {
            console.log(data)
            dispatchGameAction({type: 'resetGameState', payload: {}});
            dispatchGameAction({type: 'setInLobby', payload: data.inLobby});
        }
        const gameOverAnnouncementHandler = (data: { gameOver: boolean }) => {
            console.log(data)
            dispatchGameAction({type: 'announceGameOver', payload: {...data}});
        }
        const startRoundHandler = (data: { round: Round, currentRound: number }) => {
            dispatchGameAction({type: 'addRound', payload: {...data}});
            dispatchGameAction({type: 'announceRound', payload: {announceRound: true}});
        }
        const playerRolesHandler = (data: { guesser: { id: string } }) => {
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
        const countdownHandler = (data: { countdown: number }) => {
            dispatchCountdownAction({type: 'updateCountdown', payload: {...data}});
        }
        const endHintHandler = (data: { message: string }) => {
            console.log(data)
        };
        const announceDeduplicationHandler = (data: { message: string }) => dispatchGameAction({
            type: 'announceDeduplication',
            payload: {announceDeduplication: true}
        });
        const startDeduplicationHandler = (data: { deduplication: boolean, currentRound: number, currentTurn: number }) => {
            deduplicationHandler(data)
            dispatchGameAction({type: 'announceDeduplication', payload: {announceDeduplication: false}});
        }
        const endDeduplicationHandler = (data: { deduplication: boolean, currentRound: number, currentTurn: number }) => {
            deduplicationHandler(data)
        }
        const deduplicationHandler = (data: { deduplication: boolean, currentRound: number, currentTurn: number }) => {
            dispatchGameAction({type: 'setDeduplication', payload: {...data}});
        }
        const guessStartAnnounceHandler = (data: { announceGuessStart: boolean }) => {
            dispatchGameAction({type: 'announceGuessStart', payload: {...data}});
        }
        const turnHintsHandler = (data: { hints: Hint[], currentRound: number, currentTurn: number }) => {
            dispatchGameAction({type: 'addHints', payload: {...data}});
        }
        const turnHintsRevealHandler = (data: { reveal: boolean, currentRound: number, currentTurn: number }) => {
            dispatchGameAction({type: 'announceGuessStart', payload: {announceGuessStart: false}});
            dispatchGameAction({type: 'setTurnHintsReveal', payload: {...data}});

        }
        const turnResultHandler = (data: { currentRound: number, currentTurn: number, points: number, maxTurn: number, result: string, guess: string }) => dispatchGameAction({
            type: 'setTurnResult',
            payload: {...data}
        });
        const showAllPlayersHandler = (data: { players: any }) => {
            dispatchPlayerAction({type: 'updateAllPlayers', payload: data.players.map(toPlayer)});
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
        socket?.on('disconnect', (reason: string) => {
            if (reason === "io server disconnect") {
                dispatchGameAction({type: 'resetGameState', payload: {}});
                dispatchGameAction({type: 'setInLobby', payload: false});
                setSocket(undefined);
                // socket.connect();
            }
        })
        socket?.on('disconnected', (data: { disconnectedPlayer: any }) => {
            dispatchPlayerAction({type: 'removePlayer', payload: toPlayer(data.disconnectedPlayer)})
        })
        socket?.on('player-joined-lobby', playerJoinedHandler)
        socket?.on('game-settings-maxRound', gameSettingsUpdateHandler)
        socket?.on('game-settings-hintTimeout', gameSettingsUpdateHandler)
        socket?.on('game-settings-guessTimeout', gameSettingsUpdateHandler)
        socket?.on('player-ready-change', playerReadyChangeHandler)
        socket?.on('show-game-state', showGameStateHandler)
        socket?.on('start-game', lobbyStateHandler)
        socket?.on('start-round', startRoundHandler)
        socket?.on('player-roles', playerRolesHandler)
        socket?.on('new-turn', newTurnHandler)
        socket?.on('start-turn', startTurnHandler)
        socket?.on('countdown', countdownHandler)
        socket?.on('end-hint', endHintHandler)
        socket?.on('announce-deduplication', announceDeduplicationHandler)
        socket?.on('start-deduplication', startDeduplicationHandler)
        socket?.on('end-deduplication', endDeduplicationHandler)
        socket?.on('announce-guess-start', guessStartAnnounceHandler)
        socket?.on('turn-hints', turnHintsHandler)
        socket?.on('turn-hints-reveal', turnHintsRevealHandler)
        socket?.on('turn-result', turnResultHandler)
        socket?.on('end-round', endRoundHandler)
        socket?.on('game-over-announcement', gameOverAnnouncementHandler)
        socket?.on('end-game', lobbyStateHandler)
        socket?.on('show-all-players', showAllPlayersHandler)
        socket?.on('game-result', gameResultHandler)

        return () => {
            socket?.off('player-joined-lobby', playerJoinedHandler)
            socket?.off('game-settings-maxRound', gameSettingsUpdateHandler)
            socket?.off('game-settings-hintTimeout', gameSettingsUpdateHandler)
            socket?.off('game-settings-guessTimeout', gameSettingsUpdateHandler)
            socket?.off('player-ready-change', playerReadyChangeHandler)
            socket?.off('show-game-state', showGameStateHandler)
            socket?.off('start-game', lobbyStateHandler)
            socket?.off('start-round', startRoundHandler)
            socket?.off('player-roles', playerRolesHandler)
            socket?.off('new-turn', newTurnHandler)
            socket?.off('start-turn', startTurnHandler)
            socket?.off('countdown', countdownHandler)
            socket?.off('end-hint', endHintHandler)
            socket?.off('announce-deduplication', announceDeduplicationHandler)
            socket?.off('start-deduplication', startDeduplicationHandler)
            socket?.off('end-deduplication', endDeduplicationHandler)
            socket?.off('announce-guess-start', guessStartAnnounceHandler)
            socket?.off('turn-hints', turnHintsHandler)
            socket?.off('turn-hints-reveal', turnHintsRevealHandler)
            socket?.off('turn-result', turnResultHandler)
            socket?.off('end-round', endRoundHandler)
            socket?.off('game-over-announcement', gameOverAnnouncementHandler)
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
    const connectWebsocket = (action: string, playerName: string) => setSocket(io(`ws://${window.location.hostname}:3000`, {
        forceNew: false,
        query: {roomId, playerName, action}
    }));

    const onJoinRoom = async (playerName: string) => connectWebsocket("join", playerName)
    const onCreateRoom = async (playerName: string) => connectWebsocket("create", playerName)
    const onReady = () => socket!.emit('on-ready', {ready: !me?.isReady})
    const onHint = (hint: string) => socket!.emit('on-player-hint-submit', {hint})

    const onGuess = (event: any, guess: string, skip = false) => socket!.emit('on-player-guess-submit', {guess, skip})

    const onSkip = (event: any) => onGuess(event, "", true)

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

    const makeResultsWithDescription = (results: number[]) => results.map(result => ({...scoreDescription(result), result}))


    const onToggleAsDuplicate = (id: number) => {
        socket!.emit("toggle-hint-as-duplicate", {hintId: id})
    }

    const onDedupeSubmit = () => {
        socket!.emit("dedupe-submit")
    }
    const onChangeGameSettings = ({key, value}: { key: string, value: number }) => {
        socket!.emit(`set-${key}`, {newValue: value})
    }

    // TODO: todos here
    /*
        dont dedupe when only one hint is there
        round of max round not updating ???
        turn of maxturn not updating
        admin leaves game, other gets thrown to the lobby, orig admin goes back to room with link => can not read turns of undefined
        after dedupe during guessing hints not visible
        refactor announcements to have one boolean switch (as only one can be on at a time)
        last implementations: player limits (min 3 players, max 7 players)
     */
    const useMock = false;
    return (
        <div className={`home ${styles.home}`}>
            {useMock && <MockHome/>}
            <div className='header'>
                <Header/>
            </div>
            {!socket &&
            <div className="init">
                <StartGame onCreate={onCreateRoom} onJoin={onJoinRoom} roomId={query.get("room-id")}/>
            </div>
            }
            {(socket && inLobby) &&
            <div className="lobby">
                <Lobby players={players} me={me} onReady={onReady} hasJoined={query.get("room-id") !== null}
                       gameSettings={{maxRound, hintTimeout, guessTimeout}} onGameSettingChange={onChangeGameSettings}>
                    {!query.get("room-id") && <LinkShare roomId={roomId}/>}
                    {results && results.length > 0 &&
                        <GameResults results={makeResultsWithDescription(results)}/>
                    }
                </Lobby>
            </div>
            }
            {(socket && !inLobby) &&
            <div className="game">
                <div className="playerInfo">
                    <PlayerInfo players={players}
                                turn={rounds.length > 0 ? rounds[currentRound].turns[rounds[currentRound].currentTurn] : undefined}/>
                </div>
                <div className="playArea">
                    {(!inLobby && rounds.length > 0) &&
                    <div className={styles.playArea}>
                        {(me && !me.isGuessing && rounds.length && rounds[currentRound].turns.length > 0 && !rounds[currentRound].turns[rounds[currentRound].currentTurn].deduplication && !rounds[currentRound].turns[rounds[currentRound].currentTurn].reveal) &&
                        <Hinter
                            secretWord={rounds[currentRound].turns[rounds[currentRound].currentTurn].secretWord}
                            onHint={onHint}
                            me={me!}
                            isMinPlayerMode={players.length === minPlayersNumber}/>
                        }
                        {(me && !me.isGuessing && rounds.length && rounds[currentRound].turns.length > 0 && rounds[currentRound].turns[rounds[currentRound].currentTurn].reveal) &&
                        <DedupeHintItems
                            hints={rounds[currentRound].turns[rounds[currentRound].currentTurn].hints}
                            markAsDuplicate={onToggleAsDuplicate}
                            onSubmit={onDedupeSubmit}
                            controlsActive={rounds[currentRound].turns[rounds[currentRound].currentTurn].deduplication && me!.isAdmin}
                            players={players}/>
                        }

                        {(me && me.isGuessing && rounds.length && rounds[currentRound].turns.length > 0) &&
                        <Guesser
                            reveal={rounds[currentRound].turns[rounds[currentRound].currentTurn].reveal}
                            hints={rounds[currentRound].turns[rounds[currentRound].currentTurn].hints}
                            onGuess={onGuess}
                            onSkip={onSkip}
                            me={me!}
                            players={players}/>
                        }
                        {(rounds.length && rounds[currentRound].turns.length > 0 && rounds[currentRound].turns[rounds[currentRound].currentTurn].result && !rounds[currentRound].showRoundResults) &&
                        <Overlay>
                            <TurnResult
                                turn={rounds[currentRound].turns[rounds[currentRound].currentTurn]}
                                player={players.find(player => player.isGuessing)!}/>
                        </Overlay>
                        }
                        {rounds[currentRound].showRoundResults &&
                        <Overlay>
                            <RoundResult points={rounds[currentRound].points}
                                         scoreDescription={scoreDescription(rounds[currentRound].points)}/>
                        </Overlay>
                        }
                        {showRoles &&
                        <Overlay>
                            <RolesAnnouncement me={me} role={players.find(p => p.isGuessing)} messageText={"guessing"}/>
                        </Overlay>
                        }
                        {announceRound &&
                        <Overlay>
                            <Announcement type={"Round"} announcement={`${currentRound + 1}`}/>
                        </Overlay>
                        }
                        {announceTurn &&
                        <Overlay>
                            <Announcement type={"Turn"} announcement={`${rounds[currentRound].currentTurn + 1}`}/>
                        </Overlay>
                        }
                        {announceGameOver &&
                        <Overlay>
                            <Announcement type={"Game"} announcement={"Over"}/>
                        </Overlay>
                        }
                        {announceDeduplication &&
                        <Overlay>
                            <RolesAnnouncement
                                me={me}
                                role={players.find(p => p.isAdmin)}
                                messageText={"removing duplicate hints"}/>

                        </Overlay>
                        }
                        {announceGuessStart &&
                        <Overlay>
                            <RolesAnnouncement me={me} role={players.find(p => p.isGuessing)}
                                               messageText={"guessing now"}/>
                        </Overlay>
                        }
                    </div>

                    }
                </div>
                <div className="gameStatus">
                    {(!inLobby && rounds.length > 0) &&
                    <GameStatus
                        currentRound={currentRound}
                        currentTurn={rounds[currentRound].currentTurn}
                        maxRounds={maxRound}
                        maxTurns={maxTurn}
                        points={rounds[currentRound].points}
                    />
                    }
                </div>
                <div className="timer">
                    <Timer timeout={countdown} critical={10}/>
                </div>
            </div>
            }
        </div>

    )
}