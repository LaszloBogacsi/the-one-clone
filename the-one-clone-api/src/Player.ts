export interface Player {
    id: string
    playerName: string
    isReady: boolean
    role: PlayerRole
}
export enum PlayerRole {
    HINTER="hinter",GUESSER="guesser", ADMIN_HINTER="admin-hinter"
}