import React, {ReactElement} from "react";
import {Player} from "./Player";

interface LobbyProps {
    players: Player[];
    me?: Player;
    onReady: () => void
    children: ReactElement | null;

}

export const Lobby = (props: LobbyProps) => {
    const {players, me, onReady, children} = props;
    return (
        <div>
            <div>
                {players?.map((player: Player, index: number) => <li key={index}>id: {player.id},
                    name: {player.name} ready?: {player.isReady.toString()}</li>)
                }
            </div>
            <div>
                {me && <button onClick={onReady}>{me.isReady ? 'Not Ready' : 'I\'m Ready'}</button>}
            </div>
            {children}
        </div>
    )
}