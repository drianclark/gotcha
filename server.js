var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var express = require('express');
var request = require('node-fetch');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
var app = express();
var server = http.Server(app);
var io = socketIO(server);
var triviaCategories;
var PORT = process.env.PORT || 5000;
app.set('port', PORT);
app.use('/static', express.static(__dirname + '/static'));
if (PORT === 5000) {
    triviaCategories = {
        'mythology': 'https://opentdb.com/api.php?amount=1&category=20&difficulty=hard&type=multiple&encode=base64',
        'history': 'https://opentdb.com/api.php?amount=1&category=23&difficulty=hard&type=multiple&encode=base64',
        'celebrities': 'https://opentdb.com/api.php?amount=1&category=26&type=multiple&encode=base64'
    };
}
else {
    triviaCategories = {
        'animals': 'https://opentdb.com/api.php?amount=1&category=27&type=multiple&encode=base64',
        'generalKnowledge': 'https://opentdb.com/api.php?amount=1&category=9&type=multiple&encode=base64',
        'science&Nature': 'https://opentdb.com/api.php?amount=1&category=17&type=multiple&encode=base64',
        'books': 'https://opentdb.com/api.php?amount=1&category=10&type=multiple&encode=base64',
        'comics': 'https://opentdb.com/api.php?amount=1&category=29&type=multiple&encode=base64'
    };
}
// Routing
app.get('/', function (request, response) {
    response.sendFile(path.join(__dirname, 'index.html'));
});
// Starts the server.
server.listen(PORT, function () {
    console.log("Starting server on port " + PORT);
});
var askedQuestions = {};
var players = {};
var playerQueue = [];
var waitingFor;
var playerGivenChoices = {};
var question;
var category;
var answer;
var playerAnswers = {};
var skipVotes = [];
var gameInProgress = false;
// Add the WebSocket handlers
io.on('connection', function (socket) {
    var _this = this;
    // on join
    socket.on('join', function (username) {
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
        };
        console.log(username + ' has joined!');
        logForAll(username + ' has joined!');
        playerQueue.push(socket.id);
        updatePlayers();
        if (Object.keys(players).length >= 1) {
            console.log(players.length);
            showStartButtonToAdmin();
        }
        console.log(players);
    });
    // on quit
    socket.on('disconnect', function () {
        for (var _i = 0, _a = Object.entries(players); _i < _a.length; _i++) {
            var _b = _a[_i], player = _b[0], playerDetails = _b[1];
            if (playerDetails.socketID == socket.id) {
                var userQuit = player;
                try {
                    removeFromPlayerQueue(playerDetails.socketID);
                    for (var _c = 0, playerQueue_1 = playerQueue; _c < playerQueue_1.length; _c++) {
                        var s = playerQueue_1[_c];
                        io.to(s).emit('log', userQuit + " has quit");
                    }
                }
                catch (e) {
                    console.log(e);
                }
                delete players[player];
                break;
            }
        }
        console.log(userQuit + ' has quit');
        if (Object.keys(players).length < 2) {
            if (!gameInProgress)
                hideStartButtonToAdmin();
            else {
                gameInProgress = false;
                io.to('gameRoom').emit('insufficientPlayers');
                io.to('gameRoom').emit('returnToLobby');
            }
        }
        console.log(Object.keys(players));
        updatePlayers();
    });
    // start round
    socket.on('startRound', function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            gameInProgress = true;
            startNewRound();
            fillWaitingFor();
            return [2 /*return*/];
        });
    }); });
    // after a fake answer choice has been submitted
    socket.on('questionChoiceSubmitted', function (username, choice) {
        // handle duplicate choice
        var playerSocketID = socket.id;
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
            console.log(Object.values(playerGivenChoices));
            // combining player given choices with the correct answer in an array
            var choices = Object.values(playerGivenChoices);
            choices.push(answer);
            // transforming all strings to lowercase
            choices = choices.map(function (x) { return removePeriod(x.toLowerCase()); });
            // shuffling order of choices
            shuffle(choices);
            io.to('gameRoom').emit('displayChoices', choices);
            // filling waitingFor again
            fillWaitingFor();
        }
    });
    socket.on('skipVoteSubmitted', function (username) {
        var playerSocketID = socket.id;
        console.log(playerSocketID);
        // add user to array of skipVotes
        skipVotes.push(username);
        io.to('gameRoom').emit('skipVoteReceived', username);
        // check all players voted to skip
        if (allPlayersVotedToSkip()) {
            skipVotes = [];
            io.to('gameRoom').emit('roundEnd');
        }
    });
    // after an answer has been submitted
    socket.on('answerSubmitted', function (username, userAnswer) {
        playerAnswers[username] = userAnswer;
        var playerSocketID = socket.id;
        removeFromWaitingFor(username);
        // updates waiting for in all clients
        io.to('gameRoom').emit('updatedWaitingFor', waitingFor);
        // displays waiting for
        io.to(playerSocketID).emit('answerReceived', waitingFor);
        console.log(username + ' answered ' + userAnswer);
        if (waitingFor.length == 0) {
            console.log('The correct answer is: ' + answer);
            for (var _i = 0, _a = Object.entries(playerAnswers); _i < _a.length; _i++) {
                var _b = _a[_i], player = _b[0], playerAnswer = _b[1];
                if (playerAnswer == answer) {
                    console.log(player + ' gains a point');
                    givePoint(player);
                }
                else {
                    // if the player's answer is not their own submitted fake answer
                    // give a point to the player who made up that answer
                    if (playerAnswer != playerGivenChoices[username]) {
                        var gotBy = getPlayerWhoSubmittedFakeAnswer(playerAnswer);
                        console.log(gotBy);
                        givePoint(gotBy);
                    }
                }
                console.log(players);
            }
            // filling waitingFor again
            fillWaitingFor();
            var wrongChoices = Object.values(playerGivenChoices).filter(function (e) { return e !== answer; });
            // show results
            io.to('gameRoom').emit('displayResults', wrongChoices, answer, playerAnswers);
            // after showing results, the clients emit resultsShown
        }
    });
    socket.on('resultsShown', function (username) {
        removeFromWaitingFor(username);
        if (waitingFor.length == 0) {
            fillWaitingFor();
            io.to('gameRoom').emit('updateScores', players);
            io.to('gameRoom').emit('roundEnd', players);
        }
    });
    // after clients are done cleaning up
    socket.on('cleanupDone', function (username) {
        removeFromWaitingFor(username);
        if (waitingFor.length == 0) {
            startNewRound();
        }
    });
});
// io.sockets.emit sends message to all sockets;
// socket.on only responds to the one socket that emitted something
function updatePlayers() {
    io.to('gameRoom').emit('playersList', Object.keys(players));
}
function showStartButtonToAdmin() {
    try {
        var admin = playerQueue[0];
        io.to(admin).emit('showStartButton');
    }
    catch (e) {
        console.log(e);
    }
}
function hideStartButtonToAdmin() {
    var admin = playerQueue[0];
    io.to(admin).emit('hideStartButton');
}
function removeFromPlayerQueue(id) {
    var index = playerQueue.indexOf(id);
    if (index > -1) {
        playerQueue.splice(index, 1);
    }
}
function removeFromWaitingFor(username) {
    var index = waitingFor.indexOf(username);
    if (index > -1) {
        waitingFor.splice(index, 1);
    }
}
function startNewRound() {
    return __awaiter(this, void 0, void 0, function () {
        var questionObject;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getRandomQuestion()];
                case 1:
                    questionObject = _a.sent();
                    question = Buffer.from(questionObject.question, 'base64').toString();
                    answer = Buffer.from(questionObject.correct_answer, 'base64').toString();
                    answer = removePeriod(answer.toLowerCase());
                    category = Buffer.from(questionObject.category, 'base64').toString();
                    _a.label = 2;
                case 2:
                    if (askedQuestions[hash(answer)] != undefined || answer == undefined) return [3 /*break*/, 0];
                    _a.label = 3;
                case 3:
                    // once we've seen a new question, mark it as already seen
                    askedQuestions[hash(answer)] = 1;
                    playerAnswers = {};
                    playerGivenChoices = {};
                    fillWaitingFor();
                    io.to('gameRoom').emit('hideLogs');
                    io.to('gameRoom').emit('initaliseRoundStart', question, category, players);
                    return [2 /*return*/];
            }
        });
    });
}
function getRandomQuestion() {
    return __awaiter(this, void 0, void 0, function () {
        var url, res, questionObject;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    url = getRandomProperty(triviaCategories);
                    return [4 /*yield*/, fetch(url)];
                case 1:
                    res = _a.sent();
                    return [4 /*yield*/, res.json()];
                case 2:
                    questionObject = _a.sent();
                    return [2 /*return*/, questionObject.results[0]];
            }
        });
    });
}
function getRandomProperty(obj) {
    var keys = Object.keys(obj);
    return obj[keys[keys.length * Math.random() << 0]];
}
;
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
    io.to('gameRoom').emit('log', message);
}
function removePeriod(s) {
    if (s[s.length - 1] === ".") {
        return s.slice(0, -1);
    }
    return s;
}
function getPlayerWhoSubmittedFakeAnswer(answer) {
    for (var _i = 0, _a = Object.entries(playerGivenChoices); _i < _a.length; _i++) {
        var _b = _a[_i], player = _b[0], playerGivenChoice = _b[1];
        if (answer == playerGivenChoice)
            return player;
    }
    throw "answer is not in submitted choices";
}
function givePoint(player) {
    try {
        players[player].score += 1;
    }
    catch (e) {
        console.log(e);
    }
}
function fillWaitingFor() {
    waitingFor = Object.keys(players);
}
function hash(s) {
    return s.split("").reduce(function (a, b) { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
}
function allPlayersVotedToSkip() {
    var voteHashmap = {};
    for (var _i = 0, skipVotes_1 = skipVotes; _i < skipVotes_1.length; _i++) {
        var player = skipVotes_1[_i];
        voteHashmap[player] = 1;
    }
    console.log(voteHashmap);
    for (var _a = 0, _b = Object.keys(players); _a < _b.length; _a++) {
        var p = _b[_a];
        if (voteHashmap[p] == undefined)
            return false;
    }
    return true;
}
;
