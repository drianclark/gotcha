import React, {useState, useEffect} from "react";
import socketIOClient from "socket.io-client";
import './styles/style.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import {socket} from './socket'
import Login from './components/Login'
import Container from 'react-bootstrap/Container'
import config from './config'
import Lobby from "./components/Lobby";

enum GamePhase {
  Login = 0,
  Lobby,
  Question,
  Answer,
  Result,
  End
}

interface playerDetails {
  socketID: string;
  score: number;
}

interface players {
  [username: string]: playerDetails;
}

interface playerChoices {
  [username: string]: string;
}

interface playerAnswers {
  [username: string]: string;
}

function App() {
  let [gamePhase, setGamePhase] = useState(GamePhase.Login)
  let [username, setUsername] = useState('')
  let [players, setPlayers] = useState({})

  useEffect(() => {

  });
  
  return (
    <Container className="rootContainer">
      { gamePhase === GamePhase.Login && 

      <Login 
      setGamePhase={setGamePhase}
      setUsername={setUsername} 
      players={players}
      />
      }

      { gamePhase === GamePhase.Lobby && 
      
      <Lobby
      players={players}
      setPlayers={setPlayers}
      />

      }
      
    </Container>
  );
}

export default App;
