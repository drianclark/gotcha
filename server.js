var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');

var app = express();
var server = http.Server(app);
var io = socketIO(server);

app.set('port', 5000);
app.use('/static', express.static(__dirname + '/static'));

// Routing
app.get('/', function(request, response) {
    response.sendFile(path.join(__dirname, 'index.html'));
});

// Starts the server.
server.listen(5000, function() {
    console.log('Starting server on port 5000');
});

// https://opentdb.com/api.php?amount=10&category=9&difficulty=hard&type=multiple

var players = {}
var adminQueue = [];

// Add the WebSocket handlers
io.on('connection', function(socket) {

    // JOIN
    socket.on('join', username => {
        console.log(username + ' has joined!');

        adminQueue.push(socket.id);

        players[username] = {
            score: 0,
            socketID: socket.id
        }
        
        updatePlayers();
        showStartButtonToAdmin();

        console.log(players);
    });

    // QUIT
    socket.on('quit', username => {
        console.log(username + ' has quit');
        removeFromAdminQueue(players[username].socketID);
        delete players[username];
        console.log(Object.keys(players));
        updatePlayers();
    })

    // START GAME
    socket.on

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

function removeFromAdminQueue(id) {
    const index = adminQueue.indexOf(id);
    if (index > -1) {
        adminQueue.splice(index, 1);
    }
}