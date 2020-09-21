import React, { useState, useEffect, FormEvent } from 'react';
import { socket } from '../socket';
import Button from 'react-bootstrap/Button';
import FormControl from 'react-bootstrap/Form';
import Form from 'react-bootstrap/Form';
import Timer from './Timer'
import {GamePhase, IPlayers} from '../interfaces/interfaces'

declare var filterXSS: any;

interface IQuestionPhaseProps {
    username: string;
    question: string;
    category: string;
    setGamePhase: React.Dispatch<React.SetStateAction<GamePhase>>
}

function QuestionPhase(props: IQuestionPhaseProps) {
    var [questionChoice, setQuestionChoice] = useState('');
    var [skipVoteLoading, setSkipVoteLoading] = useState(false);
    var [skipVoteReceived, setSkipVoteReceived] = useState(false);

    useEffect(() => {

        socket.on('skipVoteReceived', (username: string) => {
            if (username === props.username) {
                setSkipVoteLoading(false);
                setSkipVoteReceived(true);
            }
        })

        socket.on('givenChoiceError', (error: string) => {
            alert(error);
        })

        socket.on('givenChoiceApproved', (choice: string) => {
            props.setGamePhase(GamePhase.Wait)
        })
        
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function handleChoiceSubmit(e: FormEvent) {
        e.preventDefault();

        if (questionChoice.trim().length > 0) {
            let sanitisedChoice = filterXSS(questionChoice.trim().toLowerCase());

            socket.emit('questionChoiceSubmitted', props.username, sanitisedChoice)
        } 
    }

    function voteSkip(){
        socket.emit('skipVoteSubmitted', props.username);
        setSkipVoteLoading(true);
    }

    return (
        <div className="questionContainer mt-5">
            <Timer/>

            <h3 id="categoryText" className="categoryText font-weight-bold text-center mt-5">
                {props.category}
            </h3>
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
                        onChange={e => setQuestionChoice((e.target as HTMLInputElement).value)}
                    />
                </div>

                <div className="col-md-2 col-sm-12 text-left align-self-stretch px-0">
                    <Button
                        type="button"
                        variant="primary"
                        className="h-100 w-100"
                        onClick={handleChoiceSubmit}
                    >
                        Submit
                    </Button>
                </div>
            </Form>

            <div className="skipQuestionRow row mt-3">
                <div className="offset-md-10 col-md-2 col-sm-12 text-left px-0">
                    <Button
                        variant="danger"
                        type="button"
                        id="skipQuestionButton"
                        disabled={skipVoteLoading || skipVoteReceived}
                        className="skipQuestionButton h-100 w-100"
                        onClick={voteSkip}
                    >{skipVoteReceived ? '' : 'Skip Question'}

                    {skipVoteLoading === true &&
                        <i className="skipQuestionSpinner fas fa-circle-notch fa-spin"></i>
                    }

                    {skipVoteReceived === true &&
                        <i className="skipQuestionCheck far fa-check-circle"></i>    
                    }
                </Button>

                </div>
            </div>
        </div>
    );
}

export default QuestionPhase;
