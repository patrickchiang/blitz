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

var board = new Board(40, 40, 40, 10);
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
        user.init(board);
        users.push(user);

        socket.emit('send board', board);
        socket.emit('send users', {users: users, local: user});

        io.sockets.emit('updated board', board);
    });

    socket.on('move', function (msg) {
        moveTroops(msg.distance, board.squareAt(msg.from.x, msg.from.y), board.squareAt(msg.to.x, msg.to.y), msg.troops);
    });

    socket.on('disconnect', function () {
        var user;
        for (var i = 0; i < users.length; i++) {
            if (users[i].id == socket.id) {
                user = users[i];
            }
        }
        if (user) {
            user.destroy(board);
            var index = users.indexOf(user);
            if (index > -1) {
                users.splice(index, 1);
            }
            io.emit('delete user', socket.id);
        }
    });
});

setInterval(function () {
    console.log(updateQueue);
}, 10);

/**
 * Game Moves
 */

function moveTroops(distance, from, to, troops) {
    // determine amount of troops to move over
    if (!from.moving) {
        from.moving = [to];
    } else if (!to.rootInSameArray(from.moving)) {
        from.moving.push(to);
    } else {
        to = null;
        from = null;
        return;
    }

    // assume valid move
    if (to.owner == from.owner) { // friendly
        transferTick(troops, from, to, attackTickRate * Math.sqrt(distance));
    } else {    // enemy
        attackTick(troops, from, to, attackTickRate * Math.sqrt(distance));
    }
}

function attackTick(timesLeft, from, to, rate) {
    if (timesLeft == 0 || from.points <= 0) {
        for (var i = 0; i < from.moving.length; i++) {
            if (from.moving[i].sameSquare(to)) {
                from.moving.splice(i, 1);
            }
        }
        return;
    }

    // vanquished square
    if (to.points == 0 || to.owner == from.owner) {
        to.owner = from.owner;
        updateQueue.squares.push({x: to.x, y: to.y, points: to.points, owner: to.owner});

        transferTick(timesLeft, from, to, rate);
        return;
    }

    from.points -= 1;
    to.points -= 1;

    updateQueue.squares.push({x: from.x, y: from.y, points: from.points, owner: from.owner});
    updateQueue.squares.push({x: to.x, y: to.y, points: to.points, owner: to.owner});

    setTimeout(function () {
        attackTick(timesLeft - 1, from, to, rate);
    }, rate);
}

function transferTick(timesLeft, from, to, rate) {
    if (timesLeft == 0 || from.points <= 0) {
        for (var i = 0; i < from.moving.length; i++) {
            if (from.moving[i].sameSquare(to)) {
                from.moving.splice(i, 1);
            }
        }
        return;
    }

    if (to.owner != from.owner) {
        attackTick(timesLeft, from, to, rate);
    }

    from.points -= 1;
    to.points += 1;

    updateQueue.squares.push({x: from.x, y: from.y, points: from.points, owner: from.owner});
    updateQueue.squares.push({x: to.x, y: to.y, points: to.points, owner: to.owner});

    setTimeout(function () {
        transferTick(timesLeft - 1, from, to, rate);
    }, rate);
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