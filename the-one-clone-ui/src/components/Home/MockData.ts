import {Hint} from "../../domain/Hint";
import {Turn} from "../../domain/Turn";
import {Player} from "../../domain/Player";
import {Round} from "../../domain/Round";

export const mockHints: Hint[] = [
    {duplicate: false, hint: "another hint", player: "1234"},
    {duplicate: false, hint: "a hint", player: "2345"},
    {duplicate: false, hint: "a some hint", player: "3456"},
    {duplicate: true, hint: "a duplicate hint", player: "4567"},
    {duplicate: true, hint: "a duplicate hint", player: "5678"},
]
export const mockTurn: Turn = {
    guess: "some guess", hints: mockHints, reveal: true, secretWord: "Secret Word", result: "failure", deduplication: true
}
export const mockPlayers: Player[] = [
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
        isMe: false,
        isReady: true,
        name: "PLayer Hinter 2",
        color: "red"
    },
    {
        id: "4567",
        isAdmin: false,
        isGuessing: true,
        isMe: true,
        isReady: true,
        name: "Player Guesser",
        color: "orange"
    },
]

export const mockGameStatusProps = {
    currentRound: 2,
    maxRounds: 5,
    currentTurn: 5,
    maxTurns: 11,
    points: 4
}

export const mockProgressBarProps = {
    currentValues: [
        3, 0, 0
    ],
    segments: [
        {maxValue: 10, className:  "hintProgress"},
        {maxValue: 10, className:  "dedupeProgress"},
        {maxValue: 10, className:  "guessProgress"},
    ]

}

export const mockHinterProps = {
    secretWord: "Big Secret Word",
    onHint: (hint: string) => console.log(hint),
    me: mockPlayers.find(p => p.isMe)!,
    isMinPlayerMode: false
}

export const mockGuesserProps = {
    onGuess: (hint: string) => console.log(hint),
    onSkip: () => console.log("SKIPPING"),
    reveal: true,
    hints: mockHints,
    me: mockPlayers.find(p => p.isMe)!,
    players: mockPlayers,
}

export const mockMe: Player = {
    id: "playerMe1",
    isAdmin: true,
    isGuessing: false,
    isMe: true,
    isReady: true,
    name: "Me the Great"
}

export const mockRounds: Round[] = [
    // {currentTurn: 3, points: 13, turns: [mockTurn], showRoundResults: true}
    {currentTurn: 3, points: 13, turns: [], showRoundResults: true}
]

export const mockLobbyParams = {
    players: mockPlayers,
    me: mockMe,
    onReady: () => console.log("ready"),
    hasJoined: true,
    gameSettings: {maxRound: 2, hintTimeout: 30, guessTimeout: 60},
    onGameSettingChange: (x: any) => console.log(x)
}

export const mockResults = [
    13,
    12,
    6,
    11
]