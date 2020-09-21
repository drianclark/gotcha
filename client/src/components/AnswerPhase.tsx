import React, { useState, useEffect } from 'react';
import { socket } from '../socket';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Button from 'react-bootstrap/Button';
import {GamePhase} from '../interfaces/interfaces'

function AnswerPhase(props: any) {
    var [choicesList, setChoicesList] = useState([]);

    function handleChoiceSelection(
        e: React.MouseEvent<HTMLElement, MouseEvent>
    ) {
        socket.emit(
            'answerSubmitted',
            props.username,
            (e.target as HTMLInputElement).value
        );
    }

    useEffect(() => {
        setChoicesList(
            props.choices.map((choice: string) => (
                <Row key={choice} className="justify-content-center mb-2">
                    <Button
                        variant="outline-primary"
                        className="choiceButton"
                        value={choice}
                        onClick={handleChoiceSelection}
                    >
                        {choice}
                    </Button>
                </Row>
            ))
        );

        socket.on('answerReceived', () => {
            props.setGamePhase(GamePhase.Wait);
        })

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Container className="choicesContainer h-100 d-flex flex-column justify-content-center">
            {choicesList}
        </Container>
    );
}

export default AnswerPhase;
