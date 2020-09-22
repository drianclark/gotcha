import React, {useState, useEffect} from 'react';
import { GamePhase, IPlayers } from '../interfaces/interfaces';

interface IEndPhaseProps {
    winners: string[];
    players: IPlayers;
    setGamePhase: React.Dispatch<React.SetStateAction<GamePhase>>
}

function EndPhase(props: IEndPhaseProps) {
    var [winnersString, setWinnersString] = useState('');
    
    useEffect(() => {
        function sleep(ms: number) {
            return new Promise((resolve) => setTimeout(resolve, ms));
        }

        async function displayWinnersAndGoToLobby() {

            if (props.winners.length === 1) {
                setWinnersString(props.winners[0]);
            } else if (props.winners.length === 2) {
                setWinnersString(`${props.winners[0]} and ${props.winners[1]}`);
            } else {
                setWinnersString(props.winners.slice(0, -1).join(', '));
                setWinnersString(winnersString + ` and ${winnersString[-1]}`);
            }

            await sleep(3000);
            props.setGamePhase(GamePhase.Lobby);
        }

        displayWinnersAndGoToLobby();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [winnersString])
    
    return (
        <div className="h-100 d-flex justify-content-center align-items-center flex-column">
            <h3>{winnersString}</h3>
            <h2>has won the game!</h2>
        </div>
    );
}

export default EndPhase;
