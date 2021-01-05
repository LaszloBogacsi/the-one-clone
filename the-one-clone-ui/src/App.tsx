import React, {ChangeEvent, useContext, useEffect, useState} from 'react';
import './App.css';
import io, {Manager, Socket} from 'socket.io-client'
import axios from 'axios'
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

function Home() {
    const [playerName, setPlayerName] = useState("");
    const [room, setRoom] = useState()
    let query = useQuery();
    const [socket, setSocket] = useState<Socket>();
    const [roomId, setRoomId] = useState("09zzt1lym3")
    const [players, setPlayers] = useState<any []>()



    // const roomId = query.get("room-id")
    const onJoinRoom = async () => {
        const action = "join"
        // @ts-ignore
        let socketInstance = io(`ws://localhost:3000`, {forceNew: false, query: { roomId, playerName, action }});
        socketInstance.on('connect',  () => {
            console.log(socketInstance)
        })

        socketInstance.on('show-players',  (data: {playersJoined: any[]}) => {
            console.log(data)
            setPlayers(data.playersJoined)
        })
        // socketInstance.on('conn-ack',  (data: any) => {
        //     console.log("from conn-ack...")
        //     console.log(socketInstance)
        //     console.log(socketInstance!.connected)
        //     console.log(data)
        // })
        setSocket(socketInstance);

    };

    const onCreateRoom = async () => {
        const action = "create"
        // const roomId = Math.random().toString(36).replace(/[^\w]+/g, '').substr(0, 10)
        // setRoomId(roomId)
        console.log(`roomId: ${roomId}`)
        // @ts-ignore
        setSocket(io(`ws://localhost:3000`, {forceNew: false, query: { roomId, playerName, action }}));


    };
    const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        setPlayerName(event.target.value || "")
    };
    return (
        <div>
            <input value={playerName} onChange={onInputChange} type="text" placeholder={"Player Name"}/>
            {/*{roomId ?*/}
                <button onClick={onJoinRoom}>Join Room</button>
                {/*:*/}
                <button onClick={onCreateRoom}>Create Room</button>
            {/*}*/}
            <div>
                {players?.map(player => <li key={player.id}>id: {player.id}, name: {player.playerName}</li>)}
            </div>
        </div>
    )
}

export default App;
