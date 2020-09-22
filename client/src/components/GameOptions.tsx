import React from 'react';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';

interface IGameOptions {
    numberOfRounds: number;
    setNumberOfRounds: React.Dispatch<React.SetStateAction<number>>
}

function GameOptions(props: IGameOptions) {
    function handleButtonClick(e: React.MouseEvent<HTMLElement, MouseEvent>) {
        props.setNumberOfRounds(parseInt((e.target as HTMLInputElement).value));
        console.log('set number of rounds to ' + parseInt((e.target as HTMLInputElement).value));
    }

    return (
        <div className="gameOptions mt-5">
            <h4 className="d-inline align-middle mr-3">Number of rounds:</h4>
            <ButtonGroup aria-label="numberOfRounds">
                <Button
                    variant={
                        props.numberOfRounds === 10
                            ? 'outline-success'
                            : 'outline-primary'
                    }
                    onClick={handleButtonClick}
                    value={10}
                    disabled={props.numberOfRounds === 10}
                >
                    10
                </Button>
                <Button
                    variant={
                        props.numberOfRounds === 20
                            ? 'outline-success'
                            : 'outline-primary'
                    }
                    onClick={handleButtonClick}
                    value={20}
                    disabled={props.numberOfRounds === 20}
                >
                    20
                </Button>
                <Button
                    variant={
                        props.numberOfRounds === 30
                            ? 'outline-success'
                            : 'outline-primary'
                    }
                    onClick={handleButtonClick}
                    value={30}
                    disabled={props.numberOfRounds === 30}
                >
                    30
                </Button>
            </ButtonGroup>
        </div>
    );
}

export default GameOptions;
