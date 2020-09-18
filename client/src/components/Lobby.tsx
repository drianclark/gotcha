import React, { useEffect, useState } from 'react';
import { socket } from '../socket';
import Container from 'react-bootstrap/Container';
import FormControl from 'react-bootstrap/FormControl';
import Button from 'react-bootstrap/Button';

declare var filterXSS: any;

interface playerDetails {
    socketID: string;
    score: number;
}

interface players {
    [username: string]: playerDetails;
}

function Lobby(props: any) {
    var [readyToStart, setReadyToStart] = useState(
        Object.keys(props.players).length > 1
    );
    var [playersList, setPlayersList] = useState(
        Object.keys(props.players).map((playerName) => <li>{playerName}</li>)
    );
    var [logs, setLogs] = useState('')

    useEffect(() => {
        socket.on('updatePlayers', (players: players) => {
            props.setPlayers({ players });
            if (Object.keys(players).length > 1) setReadyToStart(true);

            setPlayersList(
                Object.keys(players).map((playerName) => (
                    <li key={playerName}>{playerName}</li>
                ))
            );
        });

        socket.on('log', (message:string) => {
            console.log('got message ' + message);
            setLogs(logs + message + '\n')
        })
    }, []);

    return (
        <Container className="lobbyContainer mt-5" id="lobbyContainer">
            <h2>Players</h2>
            <ul id="lobbyPlayersList" className="lobbyPlayersList">
                {playersList}
            </ul>

            {readyToStart && (
                <Button
                    id="startGameButton"
                    variant="outline-success"
                    className="mt-5 startGameButton"
                >
                    Start Game!
                </Button>
            )}

            <div className="logs mt-5" id="logs">
                <FormControl
                    as="textarea"
                    value={logs}
                    rows={3}
                    className="logsBox form-control"
                    id="logsBox"
                    readOnly
                />
            </div>
        </Container>
    );
}

export default Lobby;
