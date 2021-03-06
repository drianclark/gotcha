import React, { useState, useEffect } from 'react';
import { socket } from './socket';
// import './styles/style.css';
import Login from './components/Login';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Lobby from './components/Lobby';
import QuestionPhase from './components/QuestionPhase';
import AnswerPhase from './components/AnswerPhase';
import WaitingPhase from './components/WaitingPhase';
import Results from './components/Results';
import ScoreCard from './components/ScoreCard';
import { GamePhase, IPlayers, IPlayerAnswers } from './interfaces/interfaces';
import EndPhase from './components/EndPhase';

function App() {
    var [gamePhase, setGamePhase] = useState(GamePhase.Login);
    var [username, setUsername] = useState('');
    var [players, setPlayers] = useState({});
    var [question, setQuestion] = useState('');
    var [category, setCategory] = useState('');
    var [choices, setChoices] = useState(['']);
    var [wrongChoices, setWrongChoices] = useState(['']);
    var [answer, setAnswer] = useState('');
    var [playerAnswers, setPlayerAnswers] = useState({});
    var [winners, setWinners] = useState(['']);

    useEffect(() => {
        socket.on(
            'initialiseRoundStart',
            (question: string, category: string, players: IPlayers) => {
                setQuestion(question);
                setCategory(category);
                setPlayers(players);
                setGamePhase(GamePhase.Question);
                
            }
        );

        socket.on('displayChoices', (emittedChoices: string[]) => {
            setChoices(emittedChoices);
            setGamePhase(GamePhase.Answer);
        });

        socket.on(
            'displayResults',
            (
                wrongChoices: string[],
                answer: string,
                playerAnswers: IPlayerAnswers
            ) => {
                setWrongChoices(wrongChoices);
                setAnswer(answer);
                setPlayerAnswers(playerAnswers);
                setGamePhase(GamePhase.Results);
            }
        );

        socket.on('endGame', (winners: string[], players: IPlayers) => {
            setWinners(winners);
            setPlayers(players);
            setGamePhase(GamePhase.End);
        })

        // eslint-disable-next-line react-hooks/exhaustive-deps
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

            {gamePhase === GamePhase.Wait && <WaitingPhase />}

            {gamePhase === GamePhase.Question && (
                <div>
                    <QuestionPhase
                        key={question}
                        username={username}
                        question={question}
                        category={category}
                        setGamePhase={setGamePhase}
                    />

                    <Container>
                        <Row>
                            <ScoreCard players={players} />
                        </Row>
                    </Container>
                </div>
            )}

            {gamePhase === GamePhase.Answer && (
                <AnswerPhase
                    choices={choices}
                    username={username}
                    setGamePhase={setGamePhase}
                />
            )}

            {gamePhase === GamePhase.Results && (
                <Results
                    wrongChoices={wrongChoices}
                    answer={answer}
                    playerAnswers={playerAnswers}
                    username={username}
                />
            )}

            {gamePhase === GamePhase.End && (
                <EndPhase
                    winners={winners}
                    players={players}
                    setGamePhase={setGamePhase}
                />
            )}
        </Container>
    );
}

export default App;
