import React, {useEffect, useState} from "react";
import {useLocation} from "react-router-dom";
import {Turn} from "../../domain/Turn";
import {Round} from "../../domain/Round";
import {StartGame} from "../StartGame/StartGame";
import {Lobby} from "../Lobby/Lobby";
import {GameResults} from "../GameResults/GameResults";
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
import MockToggler from "./MockToggler";
import Header from "../Header/Header";
import {
    mockGameStatusProps,
    mockGuesserProps,
    mockHinterProps,
    mockHints,
    mockLobbyParams,
    mockMe,
    mockPlayers, mockProgressBarProps,
    mockResults,
    mockRounds,
    mockTurn
} from "./MockData";
import DedupeHintItems from "../shared/DedupeHintItems/DedupeHintItems";
import useMockData from "./useMockData";
import LinkShare from "../LinkShare/LinkShare";
import styles from './styles.module.css'
import {ProgressBar} from "../ProgressBar/ProgressBar";

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

export interface ScoreDescription {
    title: string;
    description: string
}

export function MockHome() {
    const query = useQuery();

    // INPUTS
    const {mockSettings, setMockSettings} = useMockData()

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

    const [progress, setProgress] = useState<number[]>([0, 0, 0])

    useEffect(() => {
        const timeout = setTimeout(() => {
            const updateProgress = (values: number[]) => values.map((v, index, arr) => {
                if (index === 0 && v < mockProgressBarProps.segments[0].maxValue) {
                    return v + 1;
                } else if (index > 0 && arr[index - 1] === mockProgressBarProps.segments[index - 1].maxValue) {
                    return Math.min(v + 1, mockProgressBarProps.segments[index].maxValue);
                } else {
                    return v;
                }
            })
            if (progress.every((p, index) => p === mockProgressBarProps.segments[index].maxValue)) {
                setProgress(progress.map(i => 0))
            } else {
                setProgress(updateProgress)
            }
        }, 1000);
        return () => clearTimeout(timeout)
    }, [progress])
    return (
        <div className={`home ${styles.home}`}>
            <MockToggler mockSettings={mockSettings} setMockSettings={setMockSettings}/>
            <div className='header'>
                <Header/>
            </div>
            {mockSettings.mockSocket.visible &&
            <div className="init">
                <StartGame onCreate={() => {
                }} onJoin={() => {
                }} roomId={query.get("room-id")}/>
            </div>
            }
            {mockSettings.mockLobby.visible &&
            <div className="lobby">
                <Lobby {...mockLobbyParams} {...{hasJoined: query.get("room-id") !== null}}>
                    {!query.get("room-id") && <LinkShare roomId={query.get("room-id") || ""}/>}
                    {mockResults && mockResults.length > 0 ?
                        <GameResults results={makeResultsWithDescription(mockResults)}/> : null}
                </Lobby>
            </div>
            }
            {mockSettings.mockGame.visible &&
            <div className="game">
                <div className="playerInfo">
                    {mockSettings.mockPlayerInfo.visible && <PlayerInfo players={mockPlayers} turn={mockTurn}/>}
                </div>
                <div className="playArea">
                    {mockSettings.mockPlayerArea.visible &&
                    <div className={styles.playArea}>
                        {mockSettings.mockHinter.visible && <Hinter{...mockHinterProps}/>}
                        {mockSettings.mockHints.visible && <DedupeHintItems hints={mockHints}
                                                                            markAsDuplicate={(h) => console.log(h)}
                                                                            onSubmit={() => console.log("submitting")}
                                                                            controlsActive={mockTurn.deduplication && mockMe.isAdmin}
                                                                            players={mockPlayers}/>}

                        {mockSettings.mockGueser.visible && <Guesser{...mockGuesserProps}/>}
                        {mockSettings.mockTurnResults.visible &&
                        <Overlay>
                            <TurnResult player={mockPlayers.find(player => player.isGuessing)!} turn={mockTurn}/>
                        </Overlay>}
                        {mockSettings.mockRoundResults.visible &&
                        <Overlay>
                            <RoundResult points={mockRounds[0].points}
                                         scoreDescription={scoreDescription(mockRounds[0].points)}/>
                        </Overlay>}
                        {mockSettings.mockRolesAnnouncement.visible &&
                        <Overlay>
                            <RolesAnnouncement me={mockPlayers.find(p => p.isMe)}
                                               role={mockPlayers.find(p => p.isGuessing)} messageText={"guessing"}/>
                        </Overlay>}
                        {mockSettings.mockRoundAnnouncement.visible &&
                        <Overlay>
                            <Announcement type={"Round"}
                                          announcement={`${mockGameStatusProps.currentRound}`}/>
                        </Overlay>}
                        {mockSettings.mockTurnAnnouncement.visible &&
                        <Overlay>
                            <Announcement type={"Turn"}
                                          announcement={`${mockGameStatusProps.currentTurn}`}/>
                        </Overlay>}
                        {mockSettings.mockGameOverAnnouncement.visible &&
                        <Overlay>
                            <Announcement type={"Game"} announcement={"Over"}/>
                        </Overlay>}
                        {mockSettings.mockDeduplicationAnnouncement.visible &&
                        <Overlay>
                            <RolesAnnouncement
                                me={mockMe}
                                role={mockPlayers.find(p => p.isAdmin)}
                                messageText={"removing duplicate hints"}/>
                        </Overlay>}
                        {mockSettings.mockGuessStartAnnouncement.visible &&
                        <Overlay>
                            <RolesAnnouncement me={mockPlayers.find(p => p.isMe)}
                                               role={mockPlayers.find(p => p.isGuessing)}
                                               messageText={"guessing now"}/>
                        </Overlay>}
                    </div>
                    }
                </div>
                <div className="statusBar">
                    {mockSettings.mockTimer.visible && <Timer timeout={13} critical={10}/>}
                    {mockSettings.mockGameStatus.visible && <GameStatus{...mockGameStatusProps}/>}
                </div>
                <div className="progressBar">
                    <ProgressBar {...mockProgressBarProps} currentValues={progress}/>
                </div>
            </div>
            }
        </div>
    )
}