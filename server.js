/**
 * Module imports
 */

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var randomColor = require('randomcolor');

var Board = require('./models/Board.js');
var User = require('./models/User.js');

/**
 * Game Init
 */

var board = new Board(40, 40, 40, 10, 1);
board.init();

var attackTickRate = 100;

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
var userColors = [0xC05A5A, 0xC0885A, 0xC0C05A, 0x489A48, 0x435681, 0x694080,
    0x7B2F2F, 0x7B522F, 0x7B7B2F, 0x266326, 0x253353, 0x412252,
    0xFF8989, 0xFFBF89, 0xFFFF89, 0x6FCF6F, 0x677DB0, 0x9463AF,
    0x9B4242, 0x9B6B42, 0x9B9B42, 0x357C35, 0x334368, 0x542F68,
    0xE77777, 0xE7AA77, 0xE7E777, 0x60B960, 0x586C9B, 0x81549B
];

var updateQueue = {squares: []};

io.sockets.on('connection', function (socket) {
    socket.on('new user', function (msg) {
        userColors.push(userColors.shift());

        var user = new User(msg, socket.id, userColors[0]);
        var base = user.init(board);
        users.push(user);

        socket.emit('send board', board);
        socket.emit('send local user', user);
        io.sockets.emit('send users', users);

        updateSquare(base);
    });

    socket.on('move', function (msg) {
        moveTroops(msg.distance, board.squareAt(msg.from.x, msg.from.y), board.squareAt(msg.to.x, msg.to.y), msg.troops);
    });

    socket.on('disconnect', function () {
        console.log('disconnect');

        var user;
        for (var i = 0; i < users.length; i++) {
            if (users[i].id == socket.id) {
                user = users[i];
            }
        }
        if (user) {
            var scrubs = user.destroy(board);

            for (var i = 0; i < scrubs.length; i++) {
                updateSquare(scrubs[i]);
            }

            var index = users.indexOf(user);
            if (index > -1) {
                users.splice(index, 1);
            }
            io.emit('delete user', socket.id);
        }
    });
});

setInterval(function () {
    if (updateQueue.squares.length > 0) {
        io.sockets.emit('update board', {squares: updateQueue.squares});
        updateQueue.squares = [];
    }
}, 50);

setInterval(function () {
    if (board)
        board.incomeTick();
}, 1000);

setInterval(function () {
    if (board) {
        var cleanSquares = [];
        for (var i = 0; i < board.squares.length; i++) {
            cleanSquares.push(cleanSquare(board.squares[i]));
        }
        io.sockets.emit('send squares', cleanSquares);
    }
}, 5000);

/**
 * Game Moves
 */

function moveTroops(distance, from, to, troops) {
    // make sure only moving from tile to tile once
    if (!from.moving) {
        from.moving = [to];
    } else if (!to.rootInSameArray(from.moving)) {
        from.moving.push(to);
    } else {
        return;
    }

    if (from.points >= troops) {
        from.points -= troops;
    } else {
        return;
    }

    // assume valid move
    if (to.owner == from.owner) { // friendly
        transfer(troops, from, to, attackTickRate * (distance));
    } else {    // enemy
        //attackTick(troops, from, to, attackTickRate * Math.sqrt(distance));
        attack(troops, from, to, attackTickRate * (distance));
    }
}

function attack(times, from, to, rate) {
    var startTime = new Date().getTime();
    var lastTickElapsed = 0;

    var timer = setInterval(function () {
        var timeElapsed = new Date().getTime() - startTime;
        var ticksElapsed = Math.floor(timeElapsed / rate);

        if (ticksElapsed > times)
            ticksElapsed = times;

        while (ticksElapsed - lastTickElapsed > 0) {
            if (from.points <= 0) {
                for (var i = 0; i < from.moving.length; i++) {
                    if (from.moving[i].sameSquare(to)) {
                        from.moving.splice(i, 1);
                    }
                }

                updateSquare(from);
                updateSquare(to);

                clearInterval(timer);
                return;
            }

            if (from.owner == to.owner) {
                clearInterval(timer);
                transfer(times - ticksElapsed + 1, from, to, rate);
                return;
            }

            // vanquished square
            if (to.points == 0) {
                to.owner = from.owner;
                updateSquare(to);
                clearInterval(timer);
                transfer(times - ticksElapsed + 1, from, to, rate);
                return;
            }

            //from.points += lastTickElapsed - ticksElapsed;
            to.points += lastTickElapsed - ticksElapsed;

            //updateSquare(from);
            updateSquare(to);

            lastTickElapsed++;
        }

        if (ticksElapsed >= times) {
            clearInterval(timer);
            for (var i = 0; i < from.moving.length; i++) {
                if (from.moving[i].sameSquare(to)) {
                    from.moving.splice(i, 1);
                }
            }
        }
    }, 10);
}

function transfer(times, from, to, rate) {
    var startTime = new Date().getTime();
    var lastTickElapsed = 0;

    var timer = setInterval(function () {
        var timeElapsed = new Date().getTime() - startTime;
        var ticksElapsed = Math.floor(timeElapsed / rate);

        if (ticksElapsed > times)
            ticksElapsed = times;

        while (ticksElapsed - lastTickElapsed > 0) {

            if (from.points <= 0) {
                for (var i = 0; i < from.moving.length; i++) {
                    if (from.moving[i].sameSquare(to)) {
                        from.moving.splice(i, 1);
                    }
                }

                updateSquare(from);
                updateSquare(to);

                clearInterval(timer);
                return;
            }

            if (from.owner != to.owner) {
                clearInterval(timer);
                attack(times - ticksElapsed + 1, from, to, rate);
                return;
            }

            //from.points += lastTickElapsed - ticksElapsed;
            to.points -= lastTickElapsed - ticksElapsed;

            //updateSquare(from);
            updateSquare(to);

            lastTickElapsed++;
        }

        if (ticksElapsed >= times) {
            clearInterval(timer);
            for (var i = 0; i < from.moving.length; i++) {
                if (from.moving[i].sameSquare(to)) {
                    from.moving.splice(i, 1);
                }
            }
        }
    }, 10);
}

function updateSquare(square) {
    updateQueue.squares.push(cleanSquare(square));
}

function cleanSquare(square) {
    var newSquare = {};
    newSquare.x = square.x;
    newSquare.y = square.y;
    newSquare.owner = square.owner;
    newSquare.points = square.points;
    return newSquare;
}

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