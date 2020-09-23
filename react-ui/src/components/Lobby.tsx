import React, { useEffect, useState } from 'react';
import { socket } from '../socket';
import Container from 'react-bootstrap/Container';
import FormControl from 'react-bootstrap/FormControl';
import Button from 'react-bootstrap/Button';
import { IPlayers } from '../interfaces/interfaces';
import GameOptions from './GameOptions';

declare var filterXSS: any;

function Lobby(props: any) {
    var [readyToStart, setReadyToStart] = useState(
        Object.keys(props.players).length > 1
    );
    var [playersList, setPlayersList]: any = useState();
    var [logs, setLogs] = useState('');
    var [isAdmin, setIsAdmin] = useState(false);
    var [numberOfRounds, setNumberOfRounds] = useState(10);

    useEffect(() => {
        socket.on('updatePlayers', (players: IPlayers) => {
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

        socket.on('log', (message: string) => {
            setLogs(logs + message + '\n');
        });

        socket.once('assignAdmin', () => {
            setIsAdmin(true);
        });

        return function cleanup() {
            socket.off('log');
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function startGame() {
        socket.emit('startGame', numberOfRounds);
    }

    return (
        <Container className="lobbyContainer mt-5 mx-md-2" id="lobbyContainer">
            <h2>Players</h2>
            <ul id="lobbyPlayersList" className="lobbyPlayersList">
                {playersList}
            </ul>

            {readyToStart && isAdmin && (
                <Button
                    id="startGameButton"
                    variant="outline-success"
                    className="mt-5 startGameButton"
                    onClick={startGame}
                >
                    Start Game!
                </Button>
            )}

            {isAdmin && (
                <GameOptions
                    key={numberOfRounds}
                    numberOfRounds={numberOfRounds}
                    setNumberOfRounds={setNumberOfRounds}
                />
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
