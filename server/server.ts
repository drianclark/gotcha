import { start } from "repl";

const express = require('express');
const request = require('node-fetch');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');

const app = express();
const server = http.Server(app);
const io = socketIO(server);

const sqlite3 = require('sqlite3').verbose();
const sqlite = require('sqlite')

var questions: questionObject[] = [];

const PORT = process.env.PORT || 5000;
app.set('port', PORT);
app.use('/static', express.static(__dirname + '/static'));

// Routing
app.get('/', function(request, response) {
    response.sendFile(path.join(__dirname, 'index.html'));
});

// Starts the server.
server.listen(PORT, function() {
    console.log(`Starting server on port ${PORT}`);
});

type socketID = string;

interface playerDetails {
    socketID: string;
    score: number;
}

interface players {
    [username: string]: playerDetails;
}

interface playerChoices {
    [username: string]: string;
}

interface playerAnswers {
    [answer: string]: string[];
}


interface questionObject {
    question: string;
    answer: string;
    category: string;
    id: number;
}

class Timer {
    duration: number;
    timeLeft: number;
    t: NodeJS.Timeout;

    constructor(duration: number) {
        this.duration = duration;
        this.timeLeft = duration;
    }

    startTimer() {
        io.to('gameRoom').emit('timerStart', this.duration);

        this.t = setInterval(() => {
            this.timeLeft -= 1;

            if (this.timeLeft === 0) {

                for (let p of waitingFor) {
                    let playerSocketID = players[p].socketID;
                    io.to(playerSocketID).emit('timeUp');
                }
                clearInterval(this.t);
            } 

            else io.to('gameRoom').emit('timerUpdate', this.timeLeft);

        }, 1000);
    }

    stopTimer() {
        clearInterval(this.t);
        this.timeLeft = this.duration;
    }
}

var askedQuestions = {};
var players: players = {};
var playerQueue: socketID[] = [];
var waitingFor: string[] = [];
var playerGivenChoices: playerChoices = {};
var question: string;
var category: string;
var answer: string;
var playerAnswers: playerAnswers = {};
var skipVotes: Set<string> = new Set<string>();
var gameInProgress: boolean = false;

const timer = new Timer(60);

// Add the WebSocket handlers
io.on('connection', function(socket: SocketIO.Socket) {

    // on join
    socket.on('join', (username: string) => {
        // check if username doesn't exist yet

        if (username in players) {
            io.to(socket.id).emit('joinFail', 'Username already exists');
            return;
        }

        socket.emit('joinSuccess', username);
        socket.join('gameRoom');

        players[username] = {
            score: 0,
            socketID: socket.id
        }

        logForAll(username + ' has joined!');

        playerQueue.push(socket.id);
        
        updatePlayers();

        if (Object.keys(players).length > 1) {
            showStartButtonToAdmin();
        }

    });

    // on quit
    socket.on('disconnect', () => {

        for (const [player, playerDetails] of Object.entries(players)) {
            if (playerDetails.socketID == socket.id) {
                var userQuit = player;

                try {
                    removeFromPlayerQueue(playerDetails.socketID);
                    removeFromWaitingFor(player);

                    for (const s of playerQueue) {
                        io.to(s).emit('log', `${userQuit} has quit`);
                    }

                } catch (e) {
                    console.log(e);
                }

                delete players[player];
                break;
            }
        }

        socket.leaveAll();

        if (Object.keys(players).length < 2) {
            if (gameInProgress) {
                gameInProgress = false;
                timer.stopTimer();
                io.to('gameRoom').emit('insufficientPlayers');
                io.to('gameRoom').emit('returnToLobby');
            }
        }
        
        updatePlayers();
    })

    // start round
    socket.on('startRound', async () => {
        if (questions.length == 0) {
            await fetchQuestions();
        }

        gameInProgress = true;

        fillWaitingFor();
        startNewRound();
        // when the players finish answering, they emit questionChoiceSubmitted
    });

    // after a fake answer choice has been submitted
    socket.on('questionChoiceSubmitted', (username: string, choice: string) => {
        // handle duplicate choice
        if (Object.values(playerGivenChoices).includes(choice) || choice == answer) {
            io.to(socket.id).emit('givenChoiceError', `duplicate choice: ${choice}`);

            return;
        }

        io.to(socket.id).emit('givenChoiceApproved', choice);

        playerGivenChoices[username] = choice;

        // remove player from waitingFor array
        removeFromWaitingFor(username);
        io.to('gameRoom').emit('updatedWaitingFor', waitingFor);

        if (waitingFor.length == 0) {
            timer.stopTimer();
            // combining player given choices with the correct answer in an array
            let choices: string[] = Object.values(playerGivenChoices);
            choices = choices.filter(choice => !choice.includes('<no answer from'))
            choices.push(answer);

            // adding an entry for each choice to playerAnswers
            for (const choice of choices) {
                playerAnswers[choice] = [];
            }

            // transforming all strings to lowercase
            choices = choices.map(x => removePeriod(x.toLowerCase()));

            // shuffling order of choices
            shuffle(choices);

            io.to('gameRoom').emit('displayChoices', choices);
            timer.startTimer();

            // filling waitingFor again
            fillWaitingFor();
        }
    })

    socket.on('skipVoteSubmitted', (username: string) => {
        // add user to array of skipVotes
        skipVotes.add(username);
        console.log(username + ' voted to skip');

        io.to('gameRoom').emit('skipVoteReceived', username);

        // check all players voted to skip
        if (allPlayersVotedToSkip()) {
            skipVotes.clear();
            timer.stopTimer();
            startNewRound();
            // io.to('gameRoom').emit('initialiseRoundStart');
            // io.to('gameRoom').emit('roundEnd');
        }
    })

    // after an answer has been submitted
    socket.on('answerSubmitted', (username: string, userAnswer: string) => {

        playerAnswers[userAnswer].push(username);
        removeFromWaitingFor(username);

        // updates waiting for in all clients
        // displays waiting for
        io.to(socket.id).emit('answerReceived');
        io.to('gameRoom').emit('updatedWaitingFor', waitingFor);

        if (waitingFor.length == 0) {
            timer.stopTimer();

            // give point to players who answered correctly
            if (answer in playerAnswers) {
                for (const player of playerAnswers[answer]) {
                    givePoint(player);
                }
            }
            
            // give point to players who fooled other players
            // based on the number of players they fooled
            for (const [playerAnswer, players] of Object.entries(playerAnswers)) {
                if (playerAnswer !== answer) {
                    let submittedBy = getPlayerWhoSubmittedFakeAnswer(playerAnswer);
                    for (const player of players) {
                        if (player !== submittedBy) givePoint(submittedBy)
                    }
                }
            }

            // filling waitingFor again
            fillWaitingFor();
            
            let wrongChoices = Object.values(playerGivenChoices)
                                .filter(e => e !== answer)
                                .filter(e => !e.includes('<no answer from'));

            // show results
            io.to('gameRoom').emit('displayResults', wrongChoices, answer, playerAnswers);

            // after showing results, the clients emit resultsShown
        }

    });

    socket.on('resultsShown', (username: string) => {
        removeFromWaitingFor(username);

        if (waitingFor.length === 0) {
            fillWaitingFor();
            startNewRound();
        }
    });
});

async function fetchQuestions() {
    let db = await sqlite.open({
        filename: '../db/gotcha.db',
        driver: sqlite3.Database
    });

    let query:string = `SELECT * FROM questions ORDER BY random() LIMIT 100;`;

    questions = await db.all(query);
    db.close();
}


function updatePlayers() {
    io.to('gameRoom').emit('updatePlayers', players);
}

function showStartButtonToAdmin() {
    try {
        let admin: socketID = playerQueue[0];
        io.to(admin).emit('assignAdmin');
    } catch (e) {
    console.log(e);
    }
}

function removeFromPlayerQueue(id: socketID) {
    const index = playerQueue.indexOf(id);
    if (index > -1) {
        playerQueue.splice(index, 1);
    }
}

function removeFromWaitingFor(username: string) {
    const index = waitingFor.indexOf(username);
    if (index > -1) {
        waitingFor.splice(index, 1);
    }
}

function removeFromArray(a: any[], e:any) {
    const index = a.indexOf(e);
    if (index > -1) {
        a.splice(index, 1);
    }
}

async function startNewRound() {
    questions.shift();
    let questionObject = questions[0];
    question = removePeriod(questionObject.question);
    answer = questionObject.answer.trim().toLowerCase();
    category = questionObject.category;

    playerAnswers = {};
    playerGivenChoices = {};

    // io.to('gameRoom').emit('hideLogs');
    io.to('gameRoom').emit('initialiseRoundStart', question, category, players);
    timer.startTimer();
}

function shuffle(a: any[]) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}
 
function logForAll(message: string) {
    io.to('gameRoom').emit('log', message);
}

function removePeriod(s: string) {
    if (s[s.length-1] === ".") {
        return s.slice(0,-1);
    }

    return s;
}

function getPlayerWhoSubmittedFakeAnswer(answer: string) {
    for (const [player, playerGivenChoice] of Object.entries(playerGivenChoices)) {
        if (answer == playerGivenChoice) return player;
    }

    throw "answer is not in submitted choices";
}

function givePoint(player: string) {
    try {
        players[player].score += 1;
    } catch (e) {
        console.log(e);
    }
}

function fillWaitingFor() {
    waitingFor = Object.keys(players);
}

function allPlayersVotedToSkip(): boolean {
    for (const p of Object.keys(players)) {
        if (!skipVotes.has(p)) return false;
    }

    return true;
};