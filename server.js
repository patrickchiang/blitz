/**
 * Module imports
 */

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var Board = require('./models/Board.js');
var User = require('./models/User.js');

/**
 * Game Init
 */

var board = new Board(40, 40, 40, 10);
board.init();

/**
 * Views
 */

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/site/index.html');
});

/**
 * Connection Management
 */

var users = [];

io.sockets.on('connection', function (socket) {
    socket.on('new user', function (msg) {
        var user = new User(msg, socket.id);
        user.init(board);

        socket.emit('send board', board);
        io.sockets.emit('created user', user);

        users.push(user);
    });

    socket.on('disconnect', function () {
        console.log(users);

        var user;
        for (var i = 0; i < users.length; i++) {
            if (users[i].id == socket.id) {
                user = users[i];
            }
        }

        user.destroy(board);
        var index = users.indexOf(user);
        if (index > -1) {
            users.splice(index, 1);
        }

        io.emit('delete user', socket.id);
    });
});

/**
 * Static views
 */

app.use('/', express.static(__dirname + '/site'));

/**
 * Initialize server
 */
http.listen(3000, function () {
    console.log('listening on port 3000');
});