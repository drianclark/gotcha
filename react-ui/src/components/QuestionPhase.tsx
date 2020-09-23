import React, { useState, useEffect, FormEvent } from 'react';
import { socket } from '../socket';
import Button from 'react-bootstrap/Button';
import FormControl from 'react-bootstrap/Form';
import Form from 'react-bootstrap/Form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCheckCircle,
    faCircleNotch,
} from '@fortawesome/free-solid-svg-icons';
import '../styles/Question.scss'
import Timer from './Timer';
import { GamePhase } from '../interfaces/interfaces';

declare var filterXSS: any;

interface IQuestionPhaseProps {
    username: string;
    question: string;
    category: string;
    setGamePhase: React.Dispatch<React.SetStateAction<GamePhase>>;
}

function QuestionPhase(props: IQuestionPhaseProps) {
    var [questionChoice, setQuestionChoice] = useState('');
    var [skipVoteLoading, setSkipVoteLoading] = useState(false);
    var [skipVoteReceived, setSkipVoteReceived] = useState(false);

    useEffect(() => {
        socket.once('skipVoteReceived', (username: string) => {
            if (username === props.username) {
                setSkipVoteLoading(false);
                setSkipVoteReceived(true);
            }
        });

        socket.on('givenChoiceError', (error: string) => {
            alert(error);
        });

        socket.once('givenChoiceApproved', (choice: string) => {
            props.setGamePhase(GamePhase.Wait);
            console.log('got givenChoiceApproved');
        });

        socket.on('timeUp', () => {
            socket.emit(
                'questionChoiceSubmitted',
                props.username,
                `<no answer from ${props.username}>`
            );
        });

        return function cleanup() {
            socket.off('timeUp');
            socket.off('givenChoiceError');
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function handleChoiceSubmit(e: FormEvent) {
        e.preventDefault();

        if (questionChoice.trim().length > 0) {
            let sanitisedChoice = filterXSS(
                questionChoice.trim().toLowerCase()
            );

            socket.emit(
                'questionChoiceSubmitted',
                props.username,
                sanitisedChoice
            );
        }
    }

    function voteSkip() {
        socket.emit('skipVoteSubmitted', props.username);
        setSkipVoteLoading(true);
    }

    return (
        <div className="questionContainer mt-5">
            <Timer />

            <h4 className="question mt-5">{props.question}</h4>

            <Form
                className="madeUpChoiceForm mt-3 row"
                id="madeUpChoiceForm"
                onSubmit={handleChoiceSubmit}
            >
                <div className="col-md-10 col-sm-12">
                    <FormControl
                        as="textarea"
                        className="mx-auto text-center float-right"
                        value={questionChoice}
                        rows={3}
                        placeholder="Write down a fake answer!"
                        onChange={(e) =>
                            setQuestionChoice(
                                (e.target as HTMLInputElement).value
                            )
                        }
                    />
                </div>

                <div className="col-md-2 col-6 mt-md-0 mt-4 order-md-1 order-2 text-left align-self-stretch px-md-0">
                    <Button
                        type="button"
                        variant="primary"
                        className="h-100 w-100"
                        onClick={handleChoiceSubmit}
                    >
                        Submit
                    </Button>
                </div>

                <div className="skipQuestionRow mt-md-3 mt-4 offset-md-10 col-md-2 col-6 order-md-2 order-1 text-left px-md-0">
                        <Button
                            variant="danger"
                            type="button"
                            id="skipQuestionButton"
                            disabled={skipVoteLoading || skipVoteReceived}
                            className="skipQuestionButton h-100 w-100"
                            onClick={voteSkip}
                        >
                            {skipVoteReceived ? '' : 'Skip Question'}

                            {skipVoteLoading === true && (
                                <FontAwesomeIcon icon={faCircleNotch} spin />
                            )}

                            {skipVoteReceived === true && (
                                <FontAwesomeIcon icon={faCheckCircle} />
                            )}
                        </Button>
                </div>
            </Form>

            
        </div>
    );
}

export default QuestionPhase;
