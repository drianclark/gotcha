export enum GamePhase {
    Login = 0,
    Lobby,
    Wait,
    Question,
    Answer,
    Results,
    End,
}

export interface IPlayerDetails {
    socketID: string;
    score: number;
}

export interface IPlayers {
    [username: string]: IPlayerDetails;
}

export interface IPlayerChoices {
    [username: string]: string;
}


export interface IPlayerAnswers {
    [answer: string]: string[];
}


export interface IQuestionObject {
    question: string;
    answer: string;
    category: string;
    id: number;
}