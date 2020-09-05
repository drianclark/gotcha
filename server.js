const express = require('express');
const fetch = require('node-fetch');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');

const app = express();
const server = http.Server(app);
const io = socketIO(server);

const triviaCategories = {
    // 'mythology':'https://opentdb.com/api.php?amount=1&category=20&difficulty=hard&type=multiple&encode=base64',
    // 'history':'https://opentdb.com/api.php?amount=1&category=23&difficulty=hard&type=multiple&encode=base64',
    // 'celebrities':'https://opentdb.com/api.php?amount=1&category=26&type=multiple&encode=base64'
    'generalKnowledge': 'https://opentdb.com/api.php?amount=1&category=9&type=multiple&difficulty=hard&encode=base64',
    'animals': 'https://opentdb.com/api.php?amount=1&category=27&difficulty=hard&type=multiple&encode=base64'
}

var askedQuestions = [];

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

// https://opentdb.com/api.php?amount=10&category=9&difficulty=hard&type=multiple

var players = {};
var adminQueue = [];
var waitingFor = [];
var playerGivenChoices = {};
var question;
var category;
var answer;
var playerAnswers = {};


// Add the WebSocket handlers
io.on('connection', function(socket) {

    // on join
    socket.on('join', username => {
        // check if username doesn't exist yet

        if (username in players) {
            console.log('error joining');
            io.to(socket.id).emit('joinFail', 'Username already exists');
            return;
        }

        io.to(socket.id).emit('joinSuccess');

        players[username] = {
            score: 0,
            socketID: socket.id
        }

        console.log(username + ' has joined!');
        logForAll(username + ' has joined!');

        adminQueue.push(socket.id);
        
        updatePlayers();

        if (Object.keys(players).length >= 1) {
            console.log(players.length);
            showStartButtonToAdmin();
        }

        console.log(players);
    });

    // on quit
    socket.on('disconnect', () => {
        let userQuit;

        for (const [player, playerDetails] of Object.entries(players)) {
            if (playerDetails.socketID == socket.id) {
                userQuit = player;

                try {
                    removeFromAdminQueue(playerDetails.socketID);
                } catch (e) {
                    console.log(e);
                }

                delete players[player];
                break;
            }
        }

        console.log(userQuit + ' has quit');

        if (Object.keys(players).length < 2) {
            hideStartButtonToAdmin();
        }
        
        console.log(Object.keys(players));
        updatePlayers();
    })

    // start round
    socket.on('startRound', async () => {
        startNewRound();

        fillWaitingFor();
        // when the players finish answering, they emit questionChoiceSubmitted
    });

    // after a fake answer choice has been submitted
    socket.on('questionChoiceSubmitted', (username, choice) => {
        playerGivenChoices[username] = choice;

        // remove player from waitingFor array
        removeFromWaitingFor(username);
        socket.emit('updatedWaitingFor', waitingFor);

        // console.log(username + ' has submitted ' + choice);
        // console.log('waiting for ' + waitingFor.length + ' more player(s)');

        if (waitingFor.length == 0) {
            console.log(Object.values(playerGivenChoices));

            // combining player given choices with the correct answer in an array
            choices = Object.values(playerGivenChoices);
            choices.push(answer);
            console.log(choices);

            // transforming all strings to lowercase
            choices = choices.map(x => removePeriod(x.toLowerCase()));

            // shuffling order of choices
            shuffle(choices);
            
            io.sockets.emit('displayChoices', choices);

            // filling waitingFor again
            fillWaitingFor();
        }
    })

    // after an answer has been submitted
    socket.on('answerSubmitted', (username, userAnswer) => {
        playerAnswers[username] = userAnswer;

        removeFromWaitingFor(username);

        socket.emit('updatedWaitingFor', waitingFor);

        console.log(username + ' answered ' + userAnswer);

        if (waitingFor.length == 0) {
            console.log('The correct answer is: ' + answer);

            for (const [player, playerAnswer] of Object.entries(playerAnswers)) {
                if (playerAnswer == answer) {
                    console.log(player + ' gains a point');
                    givePoint(player)
                }

                else {
                    // if the player's answer is not their own submitted fake answer
                    // give a point to the player who made up that answer
                    if (playerAnswer != playerGivenChoices[username]) {
                        let gotBy = getPlayerWhoSubmittedFakeAnswer(playerAnswer);
                        console.log(gotBy);
                        givePoint(gotBy);
                    }
                }

                console.log(players);
            }

            // filling waitingFor again
            fillWaitingFor();
            
            let wrongChoices = Object.values(playerGivenChoices).filter(e => { return e !== answer });

            // show results
            io.sockets.emit('displayResults', wrongChoices, answer, playerAnswers);

            // after showing results, the clients emit resultsShown
        }

    });

    socket.on('resultsShown', (username) => {
        removeFromWaitingFor(username);

        if (waitingFor.length == 0) {
            fillWaitingFor();
            io.sockets.emit('displayScores', players);
        }
    });

    socket.on('scoresShown', (username) => {
        removeFromWaitingFor(username);

        if (waitingFor.length == 0) {
            fillWaitingFor();
            io.sockets.emit('roundEnd');
        }

    });

    // after clients are done cleaning up
    socket.on('cleanupDone', (username) => {
        removeFromWaitingFor(username);

        if (waitingFor.length == 0) {
            startNewRound();
        }
    })

});

// io.sockets.emit sends message to all sockets;
// socket.on only responds to the one socket that emitted something

function updatePlayers() {
    io.sockets.emit('playersList', Object.keys(players));
}

function showStartButtonToAdmin() {
    try {
        admin = adminQueue[0];
        io.to(admin).emit('showStartButton');
    } catch (e) {
    console.log(e);
    }
}

function hideStartButtonToAdmin() {
    admin = adminQueue[0];
    io.to(admin).emit('hideStartButton')
}

function removeFromAdminQueue(id) {
    const index = adminQueue.indexOf(id);
    if (index > -1) {
        adminQueue.splice(index, 1);
    }
}

function removeFromWaitingFor(username) {
    const index = waitingFor.indexOf(username);
    if (index > -1) {
        waitingFor.splice(index, 1);
    }
}

async function startNewRound() {
    let questionObject = await getRandomQuestion();
    question = Buffer.from(questionObject.question, 'base64').toString();
    answer = Buffer.from(questionObject.correct_answer, 'base64').toString();
    answer = removePeriod(answer.toLowerCase());
    category = Buffer.from(questionObject.category, 'base64').toString();

    while (answer == undefined || hash(answer) in askedQuestions) {
        let questionObject = await getRandomQuestion();
        question = Buffer.from(questionObject.question, 'base64').toString();
        answer = Buffer.from(questionObject.correct_answer, 'base64').toString();
        answer = removePeriod(answer.toLowerCase());
        category = Buffer.from(questionObject.category, 'base64').toString();
    }
    
    askedQuestions[hash(answer)] = 1;

    playerAnswers = {};
    playerGivenChoices = [];

    fillWaitingFor();

    io.sockets.emit('hideLogs');
    io.sockets.emit('updateQuestion', question);
}

async function getRandomQuestion() {
    var url = getRandomProperty(triviaCategories);
    let res = await fetch(url);
    let questionObject = await res.json();

    return questionObject.results[0];
}

function getRandomProperty(obj) {
    var keys = Object.keys(obj);
    return obj[keys[ keys.length * Math.random() << 0]];
};

function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}
 
function logForAll(message) {
    io.sockets.emit('log', message);
}

function removePeriod(s) {
    if (s[s.length-1] === ".") {
        return s.slice(0,-1);
    }

    return s
}

function getPlayerWhoSubmittedFakeAnswer(answer) {
    for (const [player, playerGivenChoice] of Object.entries(playerGivenChoices)) {
        if (answer == playerGivenChoice) return player;
    }

    throw "answer is not in submitted choices";
}

function givePoint(player) {
    try {
        players[player].score += 1;
    } catch (e) {
        console.log(e);
    }
}

function fillWaitingFor() {
    waitingFor = Object.keys(players);
}

function hash(s) {
    return s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);              
}
