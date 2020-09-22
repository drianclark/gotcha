import React from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button'

interface IResultRowProps {
    players: string[],
    choice: string,
    correct: boolean
}

function ResultRow(props: IResultRowProps) {

    return (
        <div>
            <Row className="choiceRow align-items-center mb-2">
                <Col sm={6} className="playerAnswersCol">
                    <p>{props.players.join(', ')}</p>
                </Col>
                <Col sm={6} className="choiceCard">
                    <Button variant={props.correct ? "outline-success" : "outline-danger"} disabled>
                        {props.choice}
                    </Button>
                </Col>
            </Row>
        </div>
    )
}

export default ResultRow
