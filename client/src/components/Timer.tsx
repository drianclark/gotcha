import React, { useState, useEffect } from 'react';
import { socket } from '../socket';

function Timer(props: any) {
    var [duration, setDuration] = useState('60')
    var [timeLeft, setTimeLeft] = useState('60');
    var [dashArray, setDashArray] = useState('283, 283')

    useEffect(() => {
        socket.on('timerStart', (duration: string) => {
            setDuration(duration);
            setTimeLeft(duration);
        });

        socket.on('timerUpdate', (timeLeft: string) => {
            setTimeLeft(timeLeft);
        });

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        let timeFraction = parseInt(timeLeft) / parseInt(duration)
        let adjustedTimeFraction = timeFraction - (1 / parseInt(duration)) * (1 - timeFraction)

        setDashArray((adjustedTimeFraction * 283).toFixed(0) + ' 283');

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeLeft])

    // // Update the dasharray value as time passes, starting with 283
    // function setCircleDasharray() {
        
    // }

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
                    <path
                        strokeDasharray={dashArray}
                        className="baseTimerPathRemaining"
                        d="
                        M 50, 50
                        m -45, 0
                        a 45,45 0 1,0 90,0
                        a 45,45 0 1,0 -90,0
                        "
                    ></path>
                </g>
            </svg>
            <span className="baseTimerLabel">{timeLeft}</span>
        </div>
    );
}

export default Timer;
