const express = require('express');
const fetch = require('node-fetch');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');
const { start } = require('repl');

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

        logForAll('--------------------------------------------');
        logForAll('Round start');
        logForAll('');
        logForAll('Gathering fake answers...');

        waitingFor = Object.keys(players);
        logWaitingFor();
        // when the players finish answering, they emit questionChoiceSubmitted
    });

    // after a fake answer choice has been submitted
    socket.on('questionChoiceSubmitted', (username, choice) => {
        playerGivenChoices[username] = choice;

        // remove player from waitingFor array
        removeFromWaitingFor(username);

        // console.log(username + ' has submitted ' + choice);
        // console.log('waiting for ' + waitingFor.length + ' more player(s)');
        if (waitingFor.length != 0) logWaitingFor();

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
            waitingFor = Object.keys(players);

            logForAll('');
            logForAll('Waiting for answers...');
            logWaitingFor();
        }
    })

    // after an answer has been submitted
    socket.on('answerSubmitted', (username, userAnswer) => {
        playerAnswers[username] = userAnswer;

        removeFromWaitingFor(username);
        logWaitingFor();

        console.log(username + ' answered ' + userAnswer);

        if (waitingFor.length == 0) {
            console.log('The correct answer is: ' + userAnswer);
            console.log(playerAnswers);

            for (const [player, userAnswer] of Object.entries(playerAnswers)) {
                if (userAnswer == answer) {
                    console.log(player + ' gains a point');

                    try {
                        players[player].score += 1;
                    } catch (e) {
                        console.log(e);
                    }
                }

                console.log(players);
            }

            // filling waitingFor again
            waitingFor = Object.keys(players);

            // on roundEnd, clients clean up 
            io.sockets.emit('roundEnd');
            // after clients clean up, they emit cleanupDone
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
    admin = adminQueue[0];
    io.to(admin).emit('showStartButton')
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
    category = Buffer.from(questionObject.category, 'base64').toString();

    playerAnswers = [];
    playerGivenChoices = [];

    waitingFor = Object.keys(players);

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

function logWaitingFor() {
    logForAll('Waiting for: ' + waitingFor);
}