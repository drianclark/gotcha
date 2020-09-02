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
var choicesContainer = document.getElementById("choices");
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
    // givenChoiceSpinner.style.display = 'block';

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
    usernameForm.style.display = "none";
    lobbyContainer.style.display = "block";
    logs.style.display = "block";
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
    startGameButton.style.display = 'block';
})

socket.on('hideStartButton', () => {
    startGameButton.style.display = 'none';
})

socket.on('updateQuestion', (question) => {
    questionContainer.style.display = "block";
    madeUpChoiceForm.style.display = "block";
    lobbyContainer.style.display = "none";

    let p = document.createElement("p");

    p.appendChild(document.createTextNode(question));

    questionDiv.appendChild(p);
})

socket.on('displayChoices', (choices => {
    // givenChoiceSpinner.style.display = 'none';
    madeUpChoiceForm.style.display = 'none';
    choicesContainer.style.display = 'block';

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
            // givenChoiceSpinner.style.display = 'block';
            socket.emit('answerSubmitted', username, choiceButton.value);
        })

        row.appendChild(choiceButton);
        choicesContainer.appendChild(row);
    });
}))

socket.on('roundEnd', () => {
    // hiding spinner
    // givenChoiceSpinner.style.display = "none";

    // hiding choices container
    choicesContainer.style.display = "none";

    // removing question text
    questionDiv.innerHTML = '';

    // removing text from textarea
    userGivenChoiceField.value = '';

    // removing choices
    choicesContainer.innerHTML = '';

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