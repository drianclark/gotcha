import React, { useEffect, useState } from 'react';
import { socket } from '../socket';
import Row from 'react-bootstrap/Row';

function WaitingPhase() {
    var [waitingForText, setWaitingForText] = useState('');

    useEffect(() => {
        socket.on('updatedWaitingFor', (waitingFor: string[]) => {
            setWaitingForText(waitingFor.join(', '));
        });

        return function cleanup() {
            socket.off('updatedWaitingFor');
        }

    }, []);

    return (
        <Row className="align-items-center justify-content-center text-center h-100">
            <div>
                <h2>Waiting for</h2>
                <h4>{waitingForText}</h4>
            </div>
        </Row>
    );
}

export default WaitingPhase;
