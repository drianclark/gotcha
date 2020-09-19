import React, { useState, useEffect } from 'react';
import {socket} from './socket'
import './styles/style.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Login from './components/Login';
import Container from 'react-bootstrap/Container';
import Lobby from './components/Lobby';
import Question from './components/Question';

enum GamePhase {
	Login = 0,
	Lobby,
	Question,
	Answer,
	Result,
	End,
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
	let [gamePhase, setGamePhase] = useState(GamePhase.Login);
	let [username, setUsername] = useState('');
	let [players, setPlayers] = useState({});
	var [question, setQuestion] = useState('');
	var [category, setCategory] = useState('');

	useEffect(() => {
		socket.on(
			'initialiseRoundStart',
			(question: string, category: string, players: players) => {
				setQuestion(question);
				setCategory(category);
				setPlayers(players)
			}
		);
	}, []);

	return (
		<Container className="rootContainer">
			{gamePhase === GamePhase.Login && (
				<Login
					setGamePhase={setGamePhase}
					setUsername={setUsername}
					players={players}
				/>
			)}

			{gamePhase === GamePhase.Lobby && (
				<Lobby
					players={players}
					setPlayers={setPlayers}
					setGamePhase={setGamePhase}
				/>
			)}

			{gamePhase === GamePhase.Question && (
				<Question
					key={question}
					username={username}
					setGamePhase={setGamePhase}
					question={question}
					category={category}
				/>
					
			)}
		</Container>
	);
}

export default App;
