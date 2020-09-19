import React, { useState, useEffect, FormEvent } from 'react';
import { socket } from '../socket';
import Button from 'react-bootstrap/Button';
import FormControl from 'react-bootstrap/Form';
import Form from 'react-bootstrap/Form';
import Timer from '../components/Timer'

declare var filterXSS: any;

enum GamePhase {
    Login = 0,
    Lobby,
    Question,
    Answer,
    Result,
    End,
}

interface playerDetails {
    socketID: string;
    score: number;
}

interface players {
    [username: string]: playerDetails;
}

function Question(props: any) {
    var [questionChoice, setQuestionChoice] = useState('');

    useEffect(() => {

        socket.on('timerUpdate', (timeLeft: string) => {});
    }, []);

    function handleChoiceSubmit(e: FormEvent) {
        e.preventDefault();

        if (questionChoice.trim().length > 0) {
            let sanitisedChoice = filterXSS(questionChoice.trim().toLowerCase());

            socket.emit('questionChoiceSubmitted', props.username, sanitisedChoice)
        } 
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
                    >
                        Submit
                    </Button>
                </div>
            </Form>
        </div>
    );
}

export default Question;
