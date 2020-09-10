import { dir } from "console";

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
    [username: string]: string;
}


interface questionObject {
    question: string;
    answer: string;
    category: string;
    id: number;timeUp
}

class Timer {
    duration: number;
    timeLeft: number;
    t: NodeJS.Timeout;

    constructor(duration: number) {
        this.duration = duration;
        this.timeLeft = duration;
        console.log(this.timeLeft);
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

const timer = new Timer(5);

// Add the WebSocket handlers
io.on('connection', function(socket: SocketIO.Socket) {

    // on join
    socket.on('join', (username: string) => {
        // check if username doesn't exist yet

        if (username in players) {
            console.log('error joining');
            io.to(socket.id).emit('joinFail', 'Username already exists');
            return;
        }

        io.to(socket.id).emit('joinSuccess');
        socket.join('gameRoom');

        players[username] = {
            score: 0,
            socketID: socket.id
        }

        logForAll(username + ' has joined!');

        playerQueue.push(socket.id);
        
        updatePlayers();

        if (Object.keys(players).length >= 1) {
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
            if (!gameInProgress) hideStartButtonToAdmin();
            

            else {
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
        let playerSocketID = socket.id;

        if (Object.values(playerGivenChoices).includes(choice) || choice == answer) {
            io.to(playerSocketID).emit('givenChoiceError', choice);

            return;
        }

        io.to(playerSocketID).emit('givenChoiceApproved', choice);

        playerGivenChoices[username] = choice;

        // remove player from waitingFor array
        removeFromWaitingFor(username);
        io.to('gameRoom').emit('updatedWaitingFor', waitingFor);

        if (waitingFor.length == 0) {
            timer.stopTimer();
            // combining player given choices with the correct answer in an array
            let choices: string[] = Object.values(playerGivenChoices);
            choices = choices.filter(choice => !choice.includes('<no answer from'))
            console.log(choices);
            choices.push(answer);
            // transforming all strings to lowercase
            choices = choices.map(x => removePeriod(x.toLowerCase()));

            // shuffling order of choices
            shuffle(choices);
            
            io.to('gameRoom').emit('displayChoices', choices);

            // filling waitingFor again
            fillWaitingFor();
        }
    })

    socket.on('skipVoteSubmitted', (username: string) => {
        let playerSocketID = socket.id;
        // add user to array of skipVotes
        skipVotes.add(username);

        io.to('gameRoom').emit('skipVoteReceived', username);

        // check all players voted to skip
        if (allPlayersVotedToSkip()) {
            skipVotes.clear();
            timer.stopTimer();
            io.to('gameRoom').emit('roundEnd');
        }
    })

    // after an answer has been submitted
    socket.on('answerSubmitted', (username: string, userAnswer: string) => {
        playerAnswers[username] = userAnswer;
        let playerSocketID = socket.id;


        removeFromWaitingFor(username);

        // updates waiting for in all clients
        io.to('gameRoom').emit('updatedWaitingFor', waitingFor);
        // displays waiting for
        io.to(playerSocketID).emit('answerReceived', waitingFor);

        if (waitingFor.length == 0) {
            for (const [player, playerAnswer] of Object.entries(playerAnswers)) {
                if (playerAnswer == answer) {
                    givePoint(player)
                }

                else {
                    // if the player's answer is not their own submitted fake answer
                    // give a point to the player who made up that answer
                    if (playerAnswer != playerGivenChoices[username]) {
                        let gotBy = getPlayerWhoSubmittedFakeAnswer(playerAnswer);
                        givePoint(gotBy);
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

        if (waitingFor.length == 0) {
            fillWaitingFor();
            io.to('gameRoom').emit('updateScores', players);
            io.to('gameRoom').emit('roundEnd', players);
        }
    });

    // after clients are done cleaning up
    socket.on('cleanupDone', (username: string) => {
        removeFromWaitingFor(username);

        if (waitingFor.length == 0) {
            // remove the current question
            questions.shift();
            fillWaitingFor();
            startNewRound();
        }
    })

});

// io.sockets.emit sends message to all sockets;
// socket.on only responds to the one socket that emitted something

async function fetchQuestions() {
    let db = await sqlite.open({
        filename: './db/gotcha.db',
        driver: sqlite3.Database
    });

    let query:string = `SELECT * FROM questions ORDER BY random() LIMIT 100;`;

    questions = await db.all(query);
    db.close();
}


function updatePlayers() {
    io.to('gameRoom').emit('playersList', Object.keys(players));
}

function showStartButtonToAdmin() {
    try {
        let admin: socketID = playerQueue[0];
        io.to(admin).emit('showStartButton');
    } catch (e) {
    console.log(e);
    }
}

function hideStartButtonToAdmin() {
    let admin: socketID = playerQueue[0];
    io.to(admin).emit('hideStartButton')
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
    let questionObject = questions[0];
    question = removePeriod(questionObject.question);
    answer = questionObject.answer.trim().toLowerCase();
    category = questionObject.category;

    playerAnswers = {};
    playerGivenChoices = {};

    timer.startTimer();
    io.to('gameRoom').emit('hideLogs');
    io.to('gameRoom').emit('initaliseRoundStart', question, category, players);
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