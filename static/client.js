var socket = io();
var username;

var lobbyContainer = document.getElementById('lobby');
var lobbyPlayersList = document.getElementById('lobbyPlayersList');
var usernameForm =document.getElementById('usernameForm');
var usernameField = document.getElementById('usernameField');
var usernameSubmit = document.getElementById('usernameSubmit')
var startGameButton = document.getElementById('startGameButton');
var questionContainer = document.getElementById('questionContainer');
var questionDiv = document.getElementById("question");
var madeUpChoiceForm = document.getElementById("madeUpChoiceForm");
var userGivenChoiceField = document.getElementById("userGivenChoice");
var submitGivenChoiceButton = document.getElementById("submitGivenChoice");
var choicesContainer = document.getElementById("choicesContainer");
var resultsContainer = document.getElementById("resultsContainer");
var resultsDiv = document.getElementById("results");
var logs = document.getElementById("logs");
var logsBox = document.getElementById("logsBox");


// var givenChoiceSpinner = document.getElementById("givenChoiceSpinner");

usernameSubmit.addEventListener("click", () => {
    if (usernameField.value.length != 0) {
        username = usernameField.value;
        socket.emit('join', username);
    } else {
        alert('Invalid username');
    }
});

startGameButton.addEventListener("click", () => {
    socket.emit('startRound');
})

submitGivenChoiceButton.addEventListener("click", () => {
    let givenChoice = userGivenChoiceField.value;

    socket.emit('questionChoiceSubmitted', username, givenChoice);
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
        li.className = "list-group-item";

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
    show(madeUpChoiceForm);
    hide(lobbyContainer);

    let p = document.createElement("p");

    p.appendChild(document.createTextNode(question));

    questionDiv.appendChild(p);
})

socket.on('displayChoices', (choices => {
    hide(madeUpChoiceForm);
    show(choicesContainer);

    choices.forEach(choice => {
        let row = document.createElement('div');
        row.className = 'row justify-content-center mb-2';

        let choiceButton = document.createElement('input')
        choiceButton.setAttribute('type', 'button');
        choiceButton.className = 'btn btn-outline-primary';
        choiceButton.value = choice;
        choiceButton.textContent = choice;
        choiceButton.style.minWidth = "30%";

        choiceButton.addEventListener("click", () => {
            socket.emit('answerSubmitted', username, choiceButton.value);
        })

        row.appendChild(choiceButton);
        choicesContainer.appendChild(row);
    });
}))

socket.on('roundEnd', () => {
    // hiding choices container
    hide(choicesContainer);

    // hiding results container
    hide(resultsContainer);

    // removing question text
    questionDiv.innerHTML = '';

    // removing results text
    resultsDiv.innerHTML = '';

    // removing text from textarea
    userGivenChoiceField.value = '';

    // removing choices
    choicesContainer.innerHTML = '';

    // signal cleanup done
    socket.emit('cleanupDone', username);
})

socket.on('displayResults', async (wrongChoices, answer, playerAnswers) => {
    console.log(`got answer: ${answer}`);
    console.log(`got wrongChoices: ${wrongChoices}`);
    console.log(playerAnswers);

    hide(questionContainer);
    show(resultsContainer);

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
    resultsDiv.appendChild(answerRow);

    wrongChoices.forEach(choice => {
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
        resultsDiv.appendChild(choiceRow);
    });

    await sleep(3000);

    socket.emit('resultsShown', username);
});

socket.on('log', (message) => {
    log(message);
})

function log(message) {
    logsBox.value += message + '\r\n';
    logsBox.scrollTop = logsBox.scrollHeight;
}

function hide (element) {
    element.style.display = 'none';
}

function show (element) {
    element.style.display = 'block';
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}