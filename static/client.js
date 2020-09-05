const socket = io();
var username;

const lobbyContainer = document.getElementById('lobbyContainer');
const lobbyPlayersList = document.getElementById('lobbyPlayersList');
const usernameForm =document.getElementById('usernameForm');
const usernameField = document.getElementById('usernameField');
const usernameSubmit = document.getElementById('usernameSubmit')
const startGameButton = document.getElementById('startGameButton');
const questionContainer = document.getElementById('questionContainer');
const questionDiv = document.getElementById("question");
const madeUpChoiceForm = document.getElementById("madeUpChoiceForm");
const userGivenChoiceField = document.getElementById("userGivenChoice");
const submitGivenChoiceButton = document.getElementById("submitGivenChoice");
const choicesContainer = document.getElementById("choicesContainer");
const resultsContainer = document.getElementById("resultsContainer");
const resultsDiv = document.getElementById("results");
const scoreBoard = document.getElementById("scoreBoard");
const waitingForContainer = document.getElementById("waitingForContainer");
const waitingForText = document.getElementById("waitingFor");
const logs = document.getElementById("logs");
const logsBox = document.getElementById("logsBox");


// var givenChoiceSpinner = document.getElementById("givenChoiceSpinner");

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
        givenChoice = filterXSS(givenChoice.trim());

        hide(questionContainer);
        hide(madeUpChoiceForm);

        show(waitingForContainer, 'flex');

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
        document.getElementById("usernameSubmit").click();
    }
});

socket.on('joinFail', (errorMessage) => {
    alert(errorMessage);
});

socket.on('joinSuccess', () => {
    console.log('join success!');

    hide(usernameForm);
    show(lobbyContainer);
    show(logs);
});

socket.on('playersList', (players) => {
    lobbyPlayersList.textContent = '';

    players.forEach(player => {
        let li = document.createElement("li");
        li.className = "joinedPlayer";

        li.appendChild(document.createTextNode(player));
        lobbyPlayersList.appendChild(li);
    });
})

socket.on('showStartButton', () => {
    show(startGameButton);
})

socket.on('hideStartButton', () => {
    hide(startGameButton);
})

socket.on('hideLogs', () => {
    hide(logs);
})

socket.on('updateQuestion', (question) => {
    show(questionContainer);
    show(madeUpChoiceForm, 'flex');
    hide(lobbyContainer);

    let questionText = document.createElement("h5");

    questionText.appendChild(document.createTextNode(question));

    questionDiv.appendChild(questionText);
})

socket.on('updatedWaitingFor', (waitingFor) => {
    console.table(waitingFor);
    waitingForText.innerHTML = waitingFor.join(', ');
})

socket.on('displayChoices', (choices => {
    hide(waitingForContainer);
    show(questionContainer);
    show(choicesContainer);

    choices.forEach(choice => {
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
        choicesContainer.appendChild(row);
    });
}))

socket.on('displayResults', async (wrongChoices, answer, playerAnswers) => {
    console.log(`got answer: ${answer}`);
    console.log(`got wrongChoices: ${wrongChoices}`);
    console.log(playerAnswers);

    hide(questionContainer);
    show(resultsContainer);
    show(resultsDiv);

    await constructAndShowRoundResults(wrongChoices, answer, playerAnswers);

    await sleep(3000);

    hide(resultsDiv);

    socket.emit('resultsShown', username);
});

socket.on('displayScores', async (players) => {
    show(scoreBoard);
    console.log('scoreboard shown');

    for (const [player, playerDetails] of Object.entries(players)) {
        let playerScoreRow = document.createElement('h5')
        playerScoreRow.textContent = `${player}: ${playerDetails.score}`

        scoreBoard.append(playerScoreRow);
    }

    await sleep(3000);

    hide(scoreBoard);
    console.log('scoreboard hidden');
    hide(resultsContainer);

    socket.emit('scoresShown', username);
})

socket.on('roundEnd', () => {
    // removing question text
    questionDiv.innerHTML = '';

    // removing results text
    resultsDiv.innerHTML = '';

    // removing text from textarea
    userGivenChoiceField.value = '';

    // removing choices
    choicesContainer.innerHTML = '';

    // removing scoreboard
    scoreBoard.innerHTML = '';

    // signal cleanup done
    socket.emit('cleanupDone', username);
})

socket.on('log', (message) => {
    log(message);
})

function log(message) {
    logsBox.value += message + '\r\n';
    logsBox.scrollTop = logsBox.scrollHeight;
}

function hide (element) {
    element.style.setProperty("display", "none", "important");
}

function show (element, displayParam=null) {
    if (displayParam != null) {
        element.style.setProperty("display", displayParam, "important");
        return;
    }

    element.style.setProperty("display", "block", "important");
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function constructAndShowRoundResults(wrongChoices, answer, playerAnswers) {
    let answerRow = document.createElement('div')
    answerRow.className = 'choiceRow row align-items-center mb-2'

    // get players who answered correctly
    let ps = Object.keys(playerAnswers).filter(player => playerAnswers[player] === answer);
    console.log('correct ' + ps);

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
        console.log('wrong ' + ps);

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
        console.log('button should contain ' + choice);
        choiceCard.textContent = choice;
        choiceCardCol.appendChild(choiceCard);

        choiceRow.appendChild(playersCol);
        choiceRow.appendChild(choiceCardCol);

        await sleep(1000);
        resultsDiv.appendChild(choiceRow);
    };
}