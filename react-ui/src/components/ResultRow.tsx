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
            <Row className="choiceRow align-items-center mb-3 mb-md-2">
                <Col xs={6} className="playerAnswersCol">
                    <p>{props.players.join(', ')}</p>
                </Col>
                <Col xs={6} className="choiceCard">
                    <Button variant={props.correct ? "outline-success" : "outline-danger"} disabled>
                        {props.choice}
                    </Button>
                </Col>
            </Row>
        </div>
    )
}

export default ResultRow
