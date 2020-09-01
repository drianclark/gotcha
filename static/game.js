var socket = io();
var username;

var lobbyPlayersList = document.getElementById('lobbyPlayersList');
var usernameField = document.getElementById('usernameField');
var startGameButton = document.getElementById('startGameButton');

window.onbeforeunload = () => {
    socket.emit('quit', username);

    return null;
}

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

function onUsernameSubmit() {
    if (usernameField.value.length != 0) {
        username = usernameField.value;
        console.log('username is: ' + username);
        document.getElementById('usernameForm').style.display = "none";
        document.getElementById('lobby').style.display = "block";

        socket.emit('join', username);

        // ask for the lobby player list from the server
    }

    else {
        alert('invalid username');
    }
}

function startGame() {
    socket.emit('startGame');
}
