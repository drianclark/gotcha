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
var _this = this;
var socket = io();
var username;
var lobbyContainer = document.getElementById('lobbyContainer');
var lobbyPlayersList = document.getElementById('lobbyPlayersList');
var usernameForm = document.getElementById('usernameForm');
var usernameField = document.getElementById('usernameField');
var usernameSubmit = document.getElementById('usernameSubmit');
var startGameButton = document.getElementById('startGameButton');
var questionContainer = document.getElementById('questionContainer');
var questionDiv = document.getElementById("question");
var categoryText = document.getElementById("categoryText");
var madeUpChoiceForm = document.getElementById("madeUpChoiceForm");
var userGivenChoiceField = document.getElementById("userGivenChoice");
var submitGivenChoiceButton = document.getElementById("submitGivenChoice");
var choicesContainer = document.getElementById("choicesContainer");
var resultsContainer = document.getElementById("resultsContainer");
var resultsDiv = document.getElementById("results");
var timerText = document.getElementById("timerText");
var skipQuestionButton = document.getElementById("skipQuestionButton");
var skipQuestionSpinner = document.getElementById("skipQuestionSpinner");
var skipQuestionCheck = document.getElementById("skipQuestionCheck");
var waitingForContainer = document.getElementById("waitingForContainer");
var waitingForText = document.getElementById("waitingFor");
var bottomContainer = document.getElementById("bottomContainer");
var scoresList = document.getElementById("scoresList");
var notificationsContainer = document.getElementById("notificationsContainer");
var logs = document.getElementById("logs");
var logsBox = document.getElementById("logsBox");
usernameSubmit.addEventListener("click", function () {
    if (usernameField.value.length != 0) {
        username = filterXSS(usernameField.value);
        socket.emit('join', username);
    }
    else {
        alert('Invalid username');
    }
});
startGameButton.addEventListener("click", function () {
    socket.emit('startRound');
});
submitGivenChoiceButton.addEventListener("click", function () {
    var givenChoice = userGivenChoiceField.value.trim();
    if (givenChoice.length != 0) {
        givenChoice = filterXSS(givenChoice.trim().toLowerCase());
        socket.emit('questionChoiceSubmitted', username, givenChoice);
    }
    else {
        alert('Please enter a fake answer');
    }
});
usernameField.addEventListener("keyup", function (event) {
    // Number 13 is the "Enter" key on the keyboard
    if (event.keyCode === 13) {
        // Cancel the default action, if needed
        event.preventDefault();
        usernameSubmit.click();
    }
});
userGivenChoiceField.addEventListener("keydown", function (event) {
    // Number 13 is the "Enter" key on the keyboard
    if (event.keyCode === 13) {
        // Cancel the default action, if needed
        event.preventDefault();
        submitGivenChoiceButton.click();
    }
});
skipQuestionButton.addEventListener("click", function () {
    socket.emit('skipVoteSubmitted', username);
    skipQuestionButton.disabled = true;
    show(skipQuestionSpinner);
});
socket.on('joinFail', function (errorMessage) {
    alert(errorMessage);
});
socket.on('joinSuccess', function () {
    hide(usernameForm);
    show(lobbyContainer);
    show(logs);
});
socket.on('playersList', function (players) {
    lobbyPlayersList.textContent = '';
    for (var _i = 0, players_1 = players; _i < players_1.length; _i++) {
        var player = players_1[_i];
        var li = document.createElement("li");
        li.className = "joinedPlayer";
        li.appendChild(document.createTextNode(player));
        lobbyPlayersList.appendChild(li);
    }
});
socket.on('showStartButton', function () {
    show(startGameButton);
});
socket.on('hideStartButton', function () {
    hide(startGameButton);
});
socket.on('hideLogs', function () {
    hide(logs);
});
socket.on('initaliseRoundStart', function (question, category, players) {
    show(questionContainer);
    show(skipQuestionButton);
    show(bottomContainer);
    show(madeUpChoiceForm, 'flex');
    hide(lobbyContainer);
    var questionText = document.createElement("h5");
    questionText.appendChild(document.createTextNode(question));
    questionDiv.appendChild(questionText);
    categoryText.textContent = category;
    scoresList.innerHTML = '';
    for (var _i = 0, _a = Object.entries(players); _i < _a.length; _i++) {
        var _b = _a[_i], player = _b[0], playerDetails = _b[1];
        var playerScoreLI = document.createElement('li');
        playerScoreLI.className = "list-group-item text-secondary py-1";
        playerScoreLI.textContent = player + ": " + playerDetails.score;
        scoresList.appendChild(playerScoreLI);
    }
    show(bottomContainer);
});
socket.on('skipVoteReceived', function (voter) {
    // if this client submitted the vote
    if (voter === username) {
        show(skipQuestionCheck);
        hide(skipQuestionSpinner);
    }
    var skipVoteNotification = document.createElement('p');
    skipVoteNotification.className = 'mb-0';
    skipVoteNotification.textContent = voter + " voted to skip question";
    notificationsContainer.appendChild(skipVoteNotification);
});
socket.on('timerStart', function (timeLeft) {
    timerText.textContent = timeLeft;
    show(timerText);
});
socket.on('timerUpdate', function (timeLeft) {
    timerText.textContent = timeLeft;
});
socket.on('timeUp', function () {
    console.log('time is up!');
});
socket.on('givenChoiceError', function (choice) {
    alert("Duplicate choice: " + choice);
});
socket.on('givenChoiceApproved', function () {
    hide(questionContainer);
    hide(madeUpChoiceForm);
    hide(timerText);
    show(waitingForContainer, 'flex');
});
socket.on('updatedWaitingFor', function (waitingFor) {
    waitingForText.innerHTML = waitingFor.join(', ');
});
socket.on('displayChoices', function (choices) {
    hide(waitingForContainer);
    hide(bottomContainer);
    show(questionContainer);
    hide(skipQuestionButton);
    show(choicesContainer);
    var _loop_1 = function (choice) {
        var row = document.createElement('div');
        row.className = 'row justify-content-center mb-2';
        var choiceButton = document.createElement('input');
        choiceButton.setAttribute('type', 'button');
        choiceButton.className = 'btn btn-outline-primary choiceButton';
        choiceButton.value = choice;
        choiceButton.textContent = choice;
        choiceButton.addEventListener("click", function () {
            socket.emit('answerSubmitted', username, choiceButton.value);
        });
        row.appendChild(choiceButton);
        choicesContainer.appendChild(row);
    };
    for (var _i = 0, choices_1 = choices; _i < choices_1.length; _i++) {
        var choice = choices_1[_i];
        _loop_1(choice);
    }
    ;
});
socket.on('answerReceived', function (waitingFor) {
    hide(questionContainer);
    hide(choicesContainer);
    show(waitingForContainer, 'flex');
});
socket.on('displayResults', function (wrongChoices, answer, playerAnswers) { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                hide(bottomContainer);
                hide(waitingForContainer);
                show(resultsContainer);
                show(resultsDiv);
                return [4 /*yield*/, constructAndShowRoundResults(wrongChoices, answer, playerAnswers)];
            case 1:
                _a.sent();
                return [4 /*yield*/, sleep(3000)];
            case 2:
                _a.sent();
                hide(resultsContainer);
                socket.emit('resultsShown', username);
                return [2 /*return*/];
        }
    });
}); });
socket.on('roundEnd', function () {
    // removing question text
    questionDiv.innerHTML = '';
    // removing results text
    resultsDiv.innerHTML = '';
    // removing text from textarea
    userGivenChoiceField.value = '';
    // removing choices
    choicesContainer.innerHTML = '';
    // removing notifications text
    notificationsContainer.innerHTML = '';
    skipQuestionButton.disabled = false;
    hide(skipQuestionSpinner);
    hide(skipQuestionCheck);
    // signal cleanup done
    socket.emit('cleanupDone', username);
});
socket.on('log', function (message) {
    log(message);
});
socket.on('insufficientPlayers', function () {
    alert('Not enough players left to play');
});
socket.on('returnToLobby', function () {
    hide(questionContainer);
    hide(waitingForContainer);
    hide(resultsContainer);
    hide(bottomContainer);
    show(lobbyContainer);
});
function log(message) {
    logsBox.value += message + '\r\n';
    logsBox.scrollTop = logsBox.scrollHeight;
}
function hide(element) {
    element.style.setProperty("display", "none", "important");
}
function show(element, displayParam) {
    if (displayParam === void 0) { displayParam = null; }
    if (displayParam != null) {
        element.style.setProperty("display", displayParam, "important");
        return;
    }
    element.style.setProperty("display", "block", "important");
}
function sleep(ms) {
    return new Promise(function (resolve) { return setTimeout(resolve, ms); });
}
function constructAndShowRoundResults(wrongChoices, answer, playerAnswers) {
    return __awaiter(this, void 0, void 0, function () {
        var answerRow, ps, playersCol, playersText, answerCardCol, answerCard, _loop_2, _i, wrongChoices_1, choice;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    answerRow = document.createElement('div');
                    answerRow.className = 'choiceRow row align-items-center mb-2';
                    ps = Object.keys(playerAnswers).filter(function (player) { return playerAnswers[player] === answer; });
                    playersCol = document.createElement('div');
                    playersCol.className = 'col-6 playerAnswersCol';
                    playersText = document.createElement('p');
                    playersText.textContent = ps.join(', ');
                    playersCol.appendChild(playersText);
                    answerCardCol = document.createElement('div');
                    answerCardCol.className = 'choiceCard col-6';
                    answerCard = document.createElement('button');
                    answerCard.setAttribute('type', 'button');
                    answerCard.disabled = true;
                    answerCard.className = 'btn btn-outline-success';
                    answerCard.textContent = answer;
                    answerCardCol.appendChild(answerCard);
                    answerRow.appendChild(playersCol);
                    answerRow.appendChild(answerCardCol);
                    return [4 /*yield*/, sleep(1000)];
                case 1:
                    _a.sent();
                    resultsDiv.appendChild(answerRow);
                    _loop_2 = function (choice) {
                        var choiceRow, ps_1, playersCol_1, playersText_1, choiceCardCol, choiceCard;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    choiceRow = document.createElement('div');
                                    choiceRow.className = 'choiceRow row align-items-center mb-2';
                                    ps_1 = Object.keys(playerAnswers).filter(function (player) { return playerAnswers[player] === choice; });
                                    playersCol_1 = document.createElement('div');
                                    playersCol_1.className = 'col-6 playerAnswersCol';
                                    playersText_1 = document.createElement('p');
                                    playersText_1.textContent = ps_1.join(', ');
                                    playersCol_1.appendChild(playersText_1);
                                    choiceCardCol = document.createElement('div');
                                    choiceCardCol.className = 'choiceCard col-6';
                                    choiceCard = document.createElement('button');
                                    choiceCard.setAttribute('type', 'button');
                                    choiceCard.disabled = true;
                                    choiceCard.className = 'btn btn-outline-danger';
                                    choiceCard.textContent = choice;
                                    choiceCardCol.appendChild(choiceCard);
                                    choiceRow.appendChild(playersCol_1);
                                    choiceRow.appendChild(choiceCardCol);
                                    return [4 /*yield*/, sleep(1000)];
                                case 1:
                                    _a.sent();
                                    resultsDiv.appendChild(choiceRow);
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, wrongChoices_1 = wrongChoices;
                    _a.label = 2;
                case 2:
                    if (!(_i < wrongChoices_1.length)) return [3 /*break*/, 5];
                    choice = wrongChoices_1[_i];
                    return [5 /*yield**/, _loop_2(choice)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5:
                    ;
                    return [2 /*return*/];
            }
        });
    });
}
