import React, {ChangeEvent, useEffect, useState} from 'react';
import './App.css';
import io, {Socket} from 'socket.io-client'
import {BrowserRouter as Router, Route, Switch, useLocation} from 'react-router-dom'

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

function App() {

    return (
        <div className="App">
                <Router>
                    <Switch>
                        <Route path={"/"} component={Home}/>
                    </Switch>
                </Router>
        </div>
    );
}

interface Player {
    id: string
    name: string
    isReady: boolean
    isMe: boolean
    isAdmin: boolean
}

function Home() {
    const [playerName, setPlayerName] = useState("");
    const [room, setRoom] = useState()
    let query = useQuery();
    const [socket, setSocket] = useState<Socket>();
    const [roomId, setRoomId] = useState("09zzt1lym3")
    const [players, setPlayers] = useState<Player[]>()
    const [me, setMe] = useState<Player>()

    useEffect(() => {
        function toPlayers(playersJoined: any[]) {
            const toPlayer = (player: any) => {
                return {
                    id: player.id,
                    name: player.playerName,
                    isReady: player.isReady,
                    isMe: player.id === socket!.id,
                    isAdmin: player.isAdmin
                }
            }
            return playersJoined.map(player => toPlayer(player));
        }

        if (socket) {
            socket.on('connect',  () => {
                console.log(socket)
            })

            socket.on('show-players',  (data: {playersJoined: any[]}) => {
                console.log(data)
                setPlayers(toPlayers(data.playersJoined))
                setMe(data.playersJoined.find(player => player.id === socket.id))
            })
            socket.on('start-game',  (data:any) => {
                console.log(data)
            })
        }
        if (players) {
            setMe(players.find(player => player.isMe))
        }
    }, [socket])


    const connectWebsocket = (action: string) => {
        // @ts-ignore
        setSocket(io(`ws://localhost:3000`, {forceNew: false, query: {roomId, playerName, action}}));
    }

    // const roomId = query.get("room-id")
    const onJoinRoom = async () => {
        const action = "join"
        connectWebsocket(action)
    };

    const onCreateRoom = async () => {
        const action = "create"
        // const roomId = Math.random().toString(36).replace(/[^\w]+/g, '').substr(0, 10)
        // setRoomId(roomId)
        console.log(`roomId: ${roomId}`)
        connectWebsocket(action)
    };

    const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        setPlayerName(event.target.value || "")
    };

    const onReady = () => {
        !me?.isReady ? socket!.emit('on-ready') : socket!.emit('on-not-ready')
    }

    return (
        <div>
            <input value={playerName} onChange={onInputChange} type="text" placeholder={"Player Name"}/>
            {/*{roomId ?*/}
                <button onClick={onJoinRoom}>Join Room</button>
                {/*:*/}
                <button onClick={onCreateRoom}>Create Room</button>
            {/*}*/}
            <div>
                Me: {JSON.stringify(me)}
            </div>
            <div>
                {players?.map(player => <li key={player.id}>id: {player.id}, name: {player.name} ready?: {player.isReady.toString()}</li>)}
            </div>
            <div>
                {me && <button onClick={onReady}>{me.isReady ? 'Not Ready' : 'I\'m Ready'}</button>}
            </div>
        </div>
    )
}

export default App;
