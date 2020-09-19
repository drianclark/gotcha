import React, { useState, useEffect } from 'react';
import {socket} from '../socket'

function Timer(props: any) {
    var [timeLeft, setTimeLeft] = useState('60');

    useEffect(() => {
        socket.on('timerStart', (duration: string) => {
            setTimeLeft(duration)

        })
        socket.on('timerUpdate', (timeLeft: string) => {
            setTimeLeft(timeLeft)
        });

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="baseTimer">
            <svg
                className="baseTimerSVG"
                viewBox="0 0 100 100"
                xmlns="http://www.w3.org/2000/svg"
            >
                <g className="baseTimerCircle">
                    <circle
                        className="baseTimerPathElapsed"
                        cx="50"
                        cy="50"
                        r="45"
                    />
                </g>
            </svg>
            <span className="baseTimerLabel">{timeLeft}</span>
        </div>
    );
}

export default Timer;
