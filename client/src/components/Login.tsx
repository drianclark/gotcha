import React, {useState, useEffect} from "react";
import {socket} from '../socket'
import FormControl from 'react-bootstrap/FormControl'
import Button from 'react-bootstrap/Button'

declare var filterXSS: any

enum GamePhase {
    Login = 0,
    Lobby,
    Question,
    Answer,
    Results,
    End
    }

function Login(props: any) {
    
    var [username, setUsername] = useState('')

    useEffect(() => {
        socket.on('joinFail', (errorMessage: string) => {
            alert(errorMessage)
        });

        socket.on('joinSuccess', () => {
            console.log('successfully joined!');
            props.setGamePhase(GamePhase.Lobby)
        });

    }, []);

    function submitUsername() {
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
                className="mt-2"
                onClick={submitUsername}
            >
                Join Game!
            </Button>
        </div>
    </div>
    );
}

export default Login;
