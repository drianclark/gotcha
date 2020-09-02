var socket = io();
var username;

var lobbyContainer = document.getElementById('lobby');
var lobbyPlayersList = document.getElementById('lobbyPlayersList');
var usernameField = document.getElementById('usernameField');
var usernameSubmit = document.getElementById('usernameSubmit')
var startGameButton = document.getElementById('startGameButton');
var questionContainer = document.getElementById('questionContainer');
var questionDiv = document.getElementById("question");
var madeUpChoiceForm = document.getElementById("madeUpChoiceForm");
var userGivenChoiceField = document.getElementById("userGivenChoice");
var submitGivenChoiceButton = document.getElementById("submitGivenChoice");
var choicesContainer = document.getElementById("choices")

usernameSubmit.addEventListener("click", () => {
    if (usernameField.value.length != 0) {
        username = usernameField.value;
        console.log('username is: ' + username);
        document.getElementById('usernameForm').style.display = "none";
        document.getElementById('lobby').style.display = "block";

        socket.emit('join', username);
    }

    else {
        alert('invalid username');
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

socket.on('playersList', (players) => {
    console.log('got ' + players + ' from server');
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
    choicesContainer.style.display = "none";

    // removing the previous question
    questionDiv.innerHTML = '';

    let p = document.createElement("p");

    p.appendChild(document.createTextNode(question));

    questionDiv.appendChild(p);
})

socket.on('displayChoices', (choices => {
    madeUpChoiceForm.style.display = 'none';
    userGivenChoiceField.value = '';
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
            socket.emit('answerSubmitted', username, choiceButton.value);
        })

        row.appendChild(choiceButton);
        choicesContainer.appendChild(row);
    });
}))
