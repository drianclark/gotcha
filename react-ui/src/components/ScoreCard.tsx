import React from 'react'
import Card from 'react-bootstrap/Card'
import ListGroupItem from 'react-bootstrap/esm/ListGroupItem';
import ListGroup from 'react-bootstrap/ListGroup'
import { IPlayers } from '../interfaces/interfaces';

interface IScoreCardProps {
    players: IPlayers;
}

function ScoreCard(props: IScoreCardProps) {
    var playerList = Object.keys(props.players).map(player => (
        <ListGroupItem key={player} className='text-secondary py-1'>
            {player}: {props.players[player].score}
        </ListGroupItem>
    ))

    return (
        <Card
            className="scoreBoard text-center mt-md-0 mt-4"
        >
            <Card.Body className="py-2">
                <Card.Title className="mb-md-3 mb-1 text-dark">Scores</Card.Title>
                <ListGroup
                    variant="flush"
                    className="scoresList list-unstyled"
                    id="scoresList"
                >
                    {playerList}
                </ListGroup>
            </Card.Body>
        </Card>
    )
}

export default ScoreCard
