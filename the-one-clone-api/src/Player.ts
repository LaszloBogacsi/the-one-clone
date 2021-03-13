export interface Player {
    id: string
    playerName: string
    isReady: boolean
    isAdmin: boolean // TODO: use Role: "ADMIN" insted
    isGuessing: boolean
}