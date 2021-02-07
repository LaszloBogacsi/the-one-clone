export interface Player {
    id: string
    name: string
    isReady: boolean
    isMe: boolean
    isAdmin: boolean
    isGuessing: boolean
    color?: string
}