import React, { useState, useEffect } from 'react';
import {socket} from '../socket'
import Container from 'react-bootstrap/Container';
import ResultRow from './ResultRow';
import { IPlayerAnswers } from '../interfaces/interfaces';
import '../styles/Results.scss'

interface IResultsProps {
    wrongChoices: string[];
    answer: string;
    playerAnswers: IPlayerAnswers;
    username: string;
}

function Results(props: IResultsProps) {
    var correctPlayers =
        props.answer in props.playerAnswers
            ? props.playerAnswers[props.answer]
            : [];

    var [wrongAnswersRows, setWrongAnswersRows]: any[] = useState([]);

    useEffect(() => {
        function sleep(ms: number) {
            return new Promise((resolve) => setTimeout(resolve, ms));
        }

        async function updateAnswersRows(){
            await sleep(1000);

            if (wrongAnswersRows.length < props.wrongChoices.length) {
                let wrongChoice = props.wrongChoices[wrongAnswersRows.length];
                let players = props.playerAnswers[wrongChoice];

                setWrongAnswersRows([
                    ...wrongAnswersRows,
                    <ResultRow
                        key={wrongChoice}
                        players={players}
                        choice={wrongChoice}
                        correct={false}
                    />,
                ]);
            }

            else {
                await sleep(3000);
                socket.emit('resultsShown', props.username);
            }
        }

        updateAnswersRows();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wrongAnswersRows]);

    return (
        <Container className="resultsContainer pt-5">
            <h2>Results</h2>
            <div className="results mt-5 pt-5 pt-md-0">
                <ResultRow
                    key={props.answer}
                    players={correctPlayers}
                    choice={props.answer}
                    correct={true}
                />
                {wrongAnswersRows}
            </div>
        </Container>
    );
}

export default Results;
