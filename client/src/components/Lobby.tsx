import React, { useEffect, useState } from 'react';
import { socket } from '../socket';
import Container from 'react-bootstrap/Container';
import FormControl from 'react-bootstrap/FormControl';
import Button from 'react-bootstrap/Button';

declare var filterXSS: any;

enum GamePhase {
    Login = 0,
    Lobby,
    Question,
    Answer,
    Results,
    End,
}

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
    var [logs, setLogs] = useState('');
    var [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        socket.on('updatePlayers', (players: players) => {
            props.setPlayers({ players });
            if (Object.keys(players).length > 1) {
                setReadyToStart(true);
            } else setReadyToStart(false);

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

        socket.on('assignAdmin', () => {
            setIsAdmin(true);
        })

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function startGame() {
        props.setGamePhase(GamePhase.Question);
        socket.emit('startRound');
    }

    return (
        <Container className="lobbyContainer mt-5" id="lobbyContainer">
            <h2>Players</h2>
            <ul id="lobbyPlayersList" className="lobbyPlayersList">
                {playersList}
            </ul>

            {readyToStart && isAdmin &&(
                <Button
                    id="startGameButton"
                    variant="outline-success"
                    className="mt-5 startGameButton"
                    onClick={startGame}
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
