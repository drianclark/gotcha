declare var filterXSS:any;
declare var io:any;

const socket = io();
var username: string;

const lobbyContainer = document.getElementById('lobbyContainer');
const lobbyPlayersList = document.getElementById('lobbyPlayersList');
const usernameForm = document.getElementById('usernameForm');
const usernameField = document.getElementById('usernameField') as HTMLInputElement;
const usernameSubmit = document.getElementById('usernameSubmit')
const startGameButton = document.getElementById('startGameButton');
const questionContainer = document.getElementById('questionContainer');
const questionDiv = document.getElementById("question");
const categoryText = document.getElementById("categoryText");
const madeUpChoiceForm = document.getElementById("madeUpChoiceForm");
const userGivenChoiceField = document.getElementById("userGivenChoice") as HTMLInputElement;
const submitGivenChoiceButton = document.getElementById("submitGivenChoice");
const choicesContainer = document.getElementById("choicesContainer");
const resultsContainer = document.getElementById("resultsContainer");
const resultsDiv = document.getElementById("results");
const choiceTimerText = document.getElementById("choiceTimerText");
const answerTimerText = document.getElementById("answerTimerText");
const skipQuestionButton = document.getElementById("skipQuestionButton") as HTMLInputElement;
const skipQuestionSpinner = document.getElementById("skipQuestionSpinner");
const skipQuestionCheck = document.getElementById("skipQuestionCheck");
const waitingForContainer = document.getElementById("waitingForContainer");
const waitingForText = document.getElementById("waitingFor");
const bottomContainer = document.getElementById("bottomContainer");
const scoresList = document.getElementById("scoresList");
const notificationsContainer = document.getElementById("notificationsContainer");
const logs = document.getElementById("logs");
const logsBox = document.getElementById("logsBox") as HTMLInputElement;

enum gameState {
    Lobby = 0,
    ChoiceSubmission,
    AnswerSubmission
}

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
    id: number;
}

usernameSubmit.addEventListener("click", () => {
    if (usernameField.value.length != 0) {
        username = filterXSS(usernameField.value);
        socket.emit('join', username);
    } else {
        alert('Invalid username');
    }
});

startGameButton.addEventListener("click", () => {
    socket.emit('startRound');
})

submitGivenChoiceButton.addEventListener("click", () => {
    let givenChoice = userGivenChoiceField.value.trim();

    if (givenChoice.length != 0) {
        givenChoice = filterXSS(givenChoice.trim().toLowerCase());

        socket.emit('questionChoiceSubmitted', username, givenChoice);
    }

    else {
        alert('Please enter a fake answer');
    }
})

usernameField.addEventListener("keyup", function(event) {
    // Number 13 is the "Enter" key on the keyboard
    if (event.keyCode === 13) {
        // Cancel the default action, if needed
        event.preventDefault();
        usernameSubmit.click();
    }
});

userGivenChoiceField.addEventListener("keydown", function(event) {
    // Number 13 is the "Enter" key on the keyboard
    if (event.keyCode === 13) {
        // Cancel the default action, if needed
        event.preventDefault();
        submitGivenChoiceButton.click();
    }
});

skipQuestionButton.addEventListener("click", () => {
    socket.emit('skipVoteSubmitted', username);
    skipQuestionButton.disabled = true;
    show(skipQuestionSpinner);
});

socket.on('joinFail', (errorMessage: string) => {
    alert(errorMessage);
});

socket.on('joinSuccess', () => {
    hide(usernameForm);
    show(lobbyContainer);
    show(logs);
});

socket.on('playersList', (players: string[]) => {
    lobbyPlayersList.textContent = '';

    for (let player of players) {
        let li = document.createElement("li");
        li.className = "joinedPlayer";

        li.appendChild(document.createTextNode(player));
        lobbyPlayersList.appendChild(li);
    }
})

socket.on('showStartButton', () => {
    show(startGameButton);
})

socket.on('hideStartButton', () => {
    hide(startGameButton);
});

socket.on('hideLogs', () => {
    hide(logs);
})

socket.on('initaliseRoundStart', (question: string, category: string, players: players) => {
    show(questionContainer);
    show(skipQuestionButton);
    show(bottomContainer);
    show(madeUpChoiceForm, 'flex');
    hide(lobbyContainer);

    let questionText = document.createElement("h5");
    questionText.appendChild(document.createTextNode(question));
    questionDiv.appendChild(questionText);

    categoryText.textContent = category;

    scoresList.innerHTML = '';
    for (const [player, playerDetails] of Object.entries(players)) {
        let playerScoreLI = document.createElement('li')
        playerScoreLI.className = "list-group-item text-secondary py-1";
        playerScoreLI.textContent = `${player}: ${playerDetails.score}`;

        scoresList.appendChild(playerScoreLI);
    }

    show(bottomContainer);
})

socket.on('skipVoteReceived', (voter: string) => {
    // if this client submitted the vote
    if (voter === username) {
        show(skipQuestionCheck);
        hide(skipQuestionSpinner);
    }

    let skipVoteNotification = document.createElement('p');
    skipVoteNotification.className = 'mb-0';
    skipVoteNotification.textContent = `${voter} voted to skip question`
    notificationsContainer.appendChild(skipVoteNotification)
});

socket.on('timerStart', (timeLeft: string) => {
    updateTimer(timeLeft);
    console.log('show timer');
    showTimer();
});

socket.on('timerUpdate', (timeLeft: string) => {
    updateTimer(timeLeft);
})

socket.on('timeUp', () => {
    console.log('time is up!');
    if (submitGivenChoiceButton.style.display != 'none') {
        socket.emit('questionChoiceSubmitted', username, `<no answer from ${username}>`);
    }
});

socket.on('givenChoiceError', (choice: string) => {
    alert(`Duplicate choice: ${choice}`);
})

socket.on('givenChoiceApproved', () => {
    hide(questionContainer);
    hide(madeUpChoiceForm);
    hide(choiceTimerText);

    show(waitingForContainer, 'flex');
})

socket.on('updatedWaitingFor', (waitingFor: string[]) => {
    waitingForText.innerHTML = waitingFor.join(', ');
})

socket.on('displayChoices', (choices: string[]) => {
    hide(waitingForContainer);
    hide(bottomContainer);
    show(questionContainer);
    hide(skipQuestionButton);
    show(choicesContainer);
    show(answerTimerText);

    for (let choice of choices) {
        let row = document.createElement('div');
        row.className = 'row justify-content-center mb-2';

        let choiceButton = document.createElement('input')
        choiceButton.setAttribute('type', 'button');
        choiceButton.className = 'btn btn-outline-primary choiceButton';
        choiceButton.value = choice;
        choiceButton.textContent = choice;

        choiceButton.addEventListener("click", () => {
            socket.emit('answerSubmitted', username, choiceButton.value);
        })

        row.appendChild(choiceButton);
        choicesContainer.insertBefore(row, choicesContainer.firstChild);
    };
})

socket.on('answerReceived', (waitingFor: string[]) => {
    hide(questionContainer);
    hide(choicesContainer);

    show(waitingForContainer, 'flex');
})

socket.on('displayResults', async (wrongChoices: string[], answer: string, playerAnswers: playerAnswers) => {
    hide(bottomContainer);
    hide(waitingForContainer);
    hide(answerTimerText);
    show(resultsContainer);
    show(resultsDiv);

    await constructAndShowRoundResults(wrongChoices, answer, playerAnswers);

    await sleep(3000);

    hide(resultsContainer);

    socket.emit('resultsShown', username);
});

socket.on('roundEnd', () => {
    // removing question text
    questionDiv.innerHTML = '';

    // removing results text
    resultsDiv.innerHTML = '';

    // removing text from textarea
    userGivenChoiceField.value = '';

    // removing choices
    choicesContainer.innerHTML = '';

    choiceTimerText.textContent = '';
    answerTimerText.textContent = '';

    // removing notifications text
    notificationsContainer.innerHTML = '';

    skipQuestionButton.disabled = false;
    hide(skipQuestionSpinner);
    hide(skipQuestionCheck);

    // signal cleanup done
    socket.emit('cleanupDone', username);
})

socket.on('log', (message: string) => {
    log(message);
})

socket.on('insufficientPlayers', () => {
    alert('Not enough players left to play');
});

socket.on('returnToLobby', () => {
    hide(questionContainer);
    hide(waitingForContainer);
    hide(resultsContainer);
    hide(bottomContainer);
    show(lobbyContainer);
});

function log(message: string) {
    logsBox.value += message + '\r\n';
    logsBox.scrollTop = logsBox.scrollHeight;
}

function hide (element: HTMLElement) {
    element.style.setProperty("display", "none", "important");
}

function show (element: HTMLElement, displayParam: string = null) {
    if (displayParam != null) {
        element.style.setProperty("display", displayParam, "important");
        return;
    }

    element.style.setProperty("display", "block", "important");
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function updateTimer(t: string) {
    // if in choice submission
    if (madeUpChoiceForm.style.display != 'none') {
        choiceTimerText.textContent = t;
        console.log('updated choice timer: ' + t);
    }

    // if in answer submission
    else if (choicesContainer.style.display != 'none') {
        answerTimerText.textContent = t;
        console.log('updated answer timer: ' + t);

    }
}

function showTimer() {
    // if in choice submission
    if (madeUpChoiceForm.style.display != 'none') {
        show(choiceTimerText);
        console.log('showed choiceTimerText');
    }

    // if in answer submission
    else if (choicesContainer.style.display != 'none') {
        show(answerTimerText);
        console.log('showed choiceTimerText');
    }

    console.log('neither timers shown');
}

async function constructAndShowRoundResults(wrongChoices: string[], answer: string, playerAnswers: playerAnswers) {
    let answerRow = document.createElement('div')
    answerRow.className = 'choiceRow row align-items-center mb-2'

    // get players who answered correctly
    let ps = Object.keys(playerAnswers).filter(player => playerAnswers[player] === answer);

    let playersCol = document.createElement('div');
    playersCol.className = 'col-6 playerAnswersCol';
    let playersText = document.createElement('p');
    playersText.textContent = ps.join(', ');
    playersCol.appendChild(playersText);

    let answerCardCol = document.createElement('div');
    answerCardCol.className = 'choiceCard col-6';
    let answerCard = document.createElement('button');
    answerCard.setAttribute('type', 'button');
    answerCard.disabled = true;
    answerCard.className = 'btn btn-outline-success'
    answerCard.textContent = answer;
    answerCardCol.appendChild(answerCard);

    answerRow.appendChild(playersCol);
    answerRow.appendChild(answerCardCol)

    await sleep(1000);

    resultsDiv.appendChild(answerRow);

    for (const choice of wrongChoices) {
        let choiceRow = document.createElement('div');
        choiceRow.className = 'choiceRow row align-items-center mb-2';

        // get players who chose this choice
        let ps = Object.keys(playerAnswers).filter(player => playerAnswers[player] === choice);

        let playersCol = document.createElement('div');
        playersCol.className = 'col-6 playerAnswersCol';
        let playersText = document.createElement('p');
        playersText.textContent = ps.join(', ');
        playersCol.appendChild(playersText);

        let choiceCardCol = document.createElement('div');
        choiceCardCol.className = 'choiceCard col-6'
        let choiceCard = document.createElement('button');
        choiceCard.setAttribute('type', 'button');
        choiceCard.disabled = true;
        choiceCard.className = 'btn btn-outline-danger';
        choiceCard.textContent = choice;
        choiceCardCol.appendChild(choiceCard);

        choiceRow.appendChild(playersCol);
        choiceRow.appendChild(choiceCardCol);

        await sleep(1000);
        resultsDiv.appendChild(choiceRow);
    };
}