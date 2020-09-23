import React, { useState, useEffect, FormEvent } from 'react';
import { socket } from '../socket';
import FormControl from 'react-bootstrap/FormControl';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import {GamePhase} from '../interfaces/interfaces'
import '../styles/Login.scss';

declare var filterXSS: any;

function Login(props: any) {
    var [username, setUsername] = useState('');

    useEffect(() => {
        socket.on('joinFail', (errorMessage: string) => {
            alert(errorMessage);
        });

        socket.once('joinSuccess', (submittedUsername: string) => {
            props.setGamePhase(GamePhase.Lobby);
            props.setUsername(submittedUsername);
        });

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function submitUsername(e: FormEvent) {
        e.preventDefault();
        if (username.length !== 0) {
            socket.emit('join', filterXSS(username));
        } else {
            alert('Invalid username');
        }
    }

    return (
        <div
            className="usernameForm row align-items-center justify-content-center text-center"
            id="usernameForm"
        >
            <div className="col-12">
                <h1>GOTCHA!</h1>
                <Form onSubmit={submitUsername}>
                    <FormControl
                        as="input"
                        type="text"
                        className="usernameField form-control mx-auto"
                        value={username}
                        placeholder="Enter your username"
                        onChange={e => setUsername(e.target.value)}
                    />
                    <Button
                        type="button"
                        variant="primary"
                        className="mt-md-2 mt-3"
                        onClick={submitUsername}
                    >
                        Join Game!
                    </Button>
                </Form>
            </div>
        </div>
    );
}

export default Login;
