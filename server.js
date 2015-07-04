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
 * User Management
 */

var localUser;

/**
 * Game Init
 */

var board = new Board(40, 40, 200, 0);
board.init();
//console.log(board.findNeighbors(board.squares[200]));
console.log(board.toString());
board.findPath(board.squares[3], board.squares[570]);

/**
 * Views
 */

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/site/index.html');
});

/**
 * Connection Management
 */

io.on('connection', function (socket) {
    socket.on('new user', function (msg) {
        var user = new User(msg, socket.id);
        localUser = user;

        socket.emit('send board', board);
        io.sockets.emit('created user', user);
    });

    socket.on('disconnect', function () {
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