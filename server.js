"use strict";
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
exports.__esModule = true;
var express = require('express');
var request = require('node-fetch');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
var app = express();
var server = http.Server(app);
var io = socketIO(server);
var sqlite3 = require('sqlite3').verbose();
var sqlite = require('sqlite');
var questions = [];
var PORT = process.env.PORT || 5000;
app.set('port', PORT);
app.use('/static', express.static(__dirname + '/static'));
// Routing
app.get('/', function (request, response) {
    response.sendFile(path.join(__dirname, 'index.html'));
});
// Starts the server.
server.listen(PORT, function () {
    console.log("Starting server on port " + PORT);
});
var Timer = /** @class */ (function () {
    function Timer(duration) {
        this.duration = duration;
        this.timeLeft = duration;
        console.log(this.timeLeft);
    }
    Timer.prototype.startTimer = function () {
        var _this = this;
        io.to('gameRoom').emit('timerStart', this.duration);
        this.t = setInterval(function () {
            _this.timeLeft -= 1;
            if (_this.timeLeft === 0) {
                for (var _i = 0, waitingFor_1 = waitingFor; _i < waitingFor_1.length; _i++) {
                    var p = waitingFor_1[_i];
                    var playerSocketID = players[p].socketID;
                    io.to(playerSocketID).emit('timeUp');
                }
                clearInterval(_this.t);
            }
            else
                io.to('gameRoom').emit('timerUpdate', _this.timeLeft);
        }, 1000);
    };
    Timer.prototype.stopTimer = function () {
        clearInterval(this.t);
        this.timeLeft = this.duration;
    };
    return Timer;
}());
var askedQuestions = {};
var players = {};
var playerQueue = [];
var waitingFor = [];
var playerGivenChoices = {};
var question;
var category;
var answer;
var playerAnswers = {};
var skipVotes = new Set();
var gameInProgress = false;
var timer = new Timer(5);
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
        logForAll(username + ' has joined!');
        playerQueue.push(socket.id);
        updatePlayers();
        if (Object.keys(players).length >= 1) {
            showStartButtonToAdmin();
        }
    });
    // on quit
    socket.on('disconnect', function () {
        for (var _i = 0, _a = Object.entries(players); _i < _a.length; _i++) {
            var _b = _a[_i], player = _b[0], playerDetails = _b[1];
            if (playerDetails.socketID == socket.id) {
                var userQuit = player;
                try {
                    removeFromPlayerQueue(playerDetails.socketID);
                    removeFromWaitingFor(player);
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
        socket.leaveAll();
        if (Object.keys(players).length < 2) {
            if (!gameInProgress)
                hideStartButtonToAdmin();
            else {
                gameInProgress = false;
                timer.stopTimer();
                io.to('gameRoom').emit('insufficientPlayers');
                io.to('gameRoom').emit('returnToLobby');
            }
        }
        updatePlayers();
    });
    // start round
    socket.on('startRound', function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(questions.length == 0)) return [3 /*break*/, 2];
                    return [4 /*yield*/, fetchQuestions()];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    gameInProgress = true;
                    fillWaitingFor();
                    startNewRound();
                    return [2 /*return*/];
            }
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
            timer.stopTimer();
            // combining player given choices with the correct answer in an array
            var choices = Object.values(playerGivenChoices);
            choices = choices.filter(function (choice) { return !choice.includes('<no answer from'); });
            console.log(choices);
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
        // add user to array of skipVotes
        skipVotes.add(username);
        io.to('gameRoom').emit('skipVoteReceived', username);
        // check all players voted to skip
        if (allPlayersVotedToSkip()) {
            skipVotes.clear();
            timer.stopTimer();
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
        if (waitingFor.length == 0) {
            for (var _i = 0, _a = Object.entries(playerAnswers); _i < _a.length; _i++) {
                var _b = _a[_i], player = _b[0], playerAnswer = _b[1];
                if (playerAnswer == answer) {
                    givePoint(player);
                }
                else {
                    // if the player's answer is not their own submitted fake answer
                    // give a point to the player who made up that answer
                    if (playerAnswer != playerGivenChoices[username]) {
                        var gotBy = getPlayerWhoSubmittedFakeAnswer(playerAnswer);
                        givePoint(gotBy);
                    }
                }
            }
            // filling waitingFor again
            fillWaitingFor();
            var wrongChoices = Object.values(playerGivenChoices)
                .filter(function (e) { return e !== answer; })
                .filter(function (e) { return !e.includes('<no answer from'); });
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
            // remove the current question
            questions.shift();
            fillWaitingFor();
            startNewRound();
        }
    });
});
// io.sockets.emit sends message to all sockets;
// socket.on only responds to the one socket that emitted something
function fetchQuestions() {
    return __awaiter(this, void 0, void 0, function () {
        var db, query;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, sqlite.open({
                        filename: './db/gotcha.db',
                        driver: sqlite3.Database
                    })];
                case 1:
                    db = _a.sent();
                    query = "SELECT * FROM questions ORDER BY random() LIMIT 100;";
                    return [4 /*yield*/, db.all(query)];
                case 2:
                    questions = _a.sent();
                    db.close();
                    return [2 /*return*/];
            }
        });
    });
}
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
function removeFromArray(a, e) {
    var index = a.indexOf(e);
    if (index > -1) {
        a.splice(index, 1);
    }
}
function startNewRound() {
    return __awaiter(this, void 0, void 0, function () {
        var questionObject;
        return __generator(this, function (_a) {
            questionObject = questions[0];
            question = removePeriod(questionObject.question);
            answer = questionObject.answer.trim().toLowerCase();
            category = questionObject.category;
            playerAnswers = {};
            playerGivenChoices = {};
            timer.startTimer();
            io.to('gameRoom').emit('hideLogs');
            io.to('gameRoom').emit('initaliseRoundStart', question, category, players);
            return [2 /*return*/];
        });
    });
}
// function startTimer() {
//     let timeLeft = 60;
//     console.log('in start timer');
//     io.to('gameRoom').emit('timerStart', timeLeft);
//     let timer = setInterval(() => {
//         timeLeft--;
//         if (waitingFor.length === 0) {
//             console.log('all players submitted');
//             clearInterval(timer);
//             fillWaitingFor();
//         }
//         else if (timeLeft === 0) {
//             for (let p of waitingFor) {
//                 let playerSocketID = players[p].socketID;
//                 io.to(playerSocketID).emit('timeUp');
//             }
//             clearInterval(timer);
//         } 
//         else io.to('gameRoom').emit('timerUpdate', timeLeft);
//     }, 1000);
// }
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
function allPlayersVotedToSkip() {
    for (var _i = 0, _a = Object.keys(players); _i < _a.length; _i++) {
        var p = _a[_i];
        if (!skipVotes.has(p))
            return false;
    }
    return true;
}
;
