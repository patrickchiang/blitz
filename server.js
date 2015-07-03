/**
 * Module imports
 */

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

/**
 * Utilities
 */

Array.prototype.shuffle = function () {
    var o = this;
    for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
};

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Board Definitions
 */

function Square(x, y, size) {
    this.x = x;
    this.y = y;
    this.size = size;

    this.owner = 0;
    this.points = 0;
}

function Board(width, height, mediums, larges) {
    this.width = width;
    this.height = height;
    this.mediums = mediums;
    this.larges = larges;

    this.squares = [];
}

Board.prototype.init = function () {
    // create all the squares
    for (var i = 0; i < this.height; i++) {
        for (var j = 0; j < this.width; j++) {
            var square = new Square(j, i, 1);
            this.squares.push(square);
        }
    }

    // iterate
    for (var i = 0; i < this.mediums; i++) {
        var candidate = this.squares[getRandomInt(0, this.squares.length - 1)];
        while (!this.isValidEnlargement(candidate, 2)) {
            candidate = this.squares[getRandomInt(0, this.squares.length - 1)]
        }

        //if (!this.isValidEnlargement(candidate, 2)) {
        //    continue;
        //}

        // found valid enlargement candidate
        candidate.size = 2;
        this.removeSquare(candidate.x + 1, candidate.y);
        this.removeSquare(candidate.x, candidate.y + 1);
        this.removeSquare(candidate.x + 1, candidate.y + 1);
    }

    // and for larges
    for (var i = 0; i < this.larges; i++) {
        var candidate = this.squares[getRandomInt(0, this.squares.length - 1)];
        while (!this.isValidEnlargement(candidate, 3)) {
            candidate = this.squares[getRandomInt(0, this.squares.length - 1)]
        }

        //if (!this.isValidEnlargement(candidate, 2)) {
        //    continue;
        //}

        // found valid enlargement candidate
        candidate.size = 3;
        this.removeSquare(candidate.x + 1, candidate.y);
        this.removeSquare(candidate.x + 2, candidate.y);
        this.removeSquare(candidate.x, candidate.y + 1);
        this.removeSquare(candidate.x + 1, candidate.y + 1);
        this.removeSquare(candidate.x + 2, candidate.y + 1);
        this.removeSquare(candidate.x, candidate.y + 2);
        this.removeSquare(candidate.x + 1, candidate.y + 2);
        this.removeSquare(candidate.x + 2, candidate.y + 2);
    }
};

Board.prototype.isValidEnlargement = function (candidate, size) {
    // top right edges
    if (this.width - candidate.x <= (size - 1) || this.height - candidate.y <= (size - 1)) {
        return false;
    }

    // already enlarged
    if (candidate.size != 1) {
        return false;
    }

    for (var i = 0; i < size; i++) {
        for (var j = 0; j < size; j++) {
            // square part of another larger square
            if (!this.isSquareExist(candidate.x + i, candidate.y + j)) {
                return false;
            }
            // square is another larger square
            if (this.squareSize(candidate.x + i, candidate.y + j) != 1) {
                return false;
            }
        }
    }

    return true;
}

Board.prototype.toString = function () {
    var print = '';
    for (var i = this.height - 1; i >= 0; i--) {
        for (var j = 0; j < this.width; j++) {
            if (this.isSquareExist(i, j)) {
                print += this.squareSize(i, j);
            } else {
                print += ' ';
            }
        }
        print += '\n';
    }

    return print;
}

Board.prototype.squareSize = function (x, y) {
    for (var i = 0; i < this.squares.length; i++) {
        if (this.squares[i].x == x && this.squares[i].y == y) {
            return this.squares[i].size;
        }
    }
    return 0;
}

Board.prototype.isSquareExist = function (x, y) {
    for (var i = 0; i < this.squares.length; i++) {
        if (this.squares[i].x == x && this.squares[i].y == y) {
            return this.squares[i].size > 0;
        }
    }
    return false;
};

Board.prototype.removeSquare = function (x, y) {
    for (var i = 0; i < this.squares.length; i++) {
        if (this.squares[i].x == x && this.squares[i].y == y) {
            this.squares.splice(i, 1);
            break;
        }
    }
};

/**
 * User Definitions
 */
function User(name, id) {
    this.name = name;
    this.color = 'blue';
    this.id = id;
}

/**
 * User Management
 */

var localUser;

/**
 * Views
 */

app.get('/', function (req, res) {
    var board = new Board(40, 40, 25, 5);
    board.init();
    console.log(board.toString());

    res.sendFile(__dirname + '/site/index.html');
});


/**
 * Connection Management
 */

io.on('connection', function (socket) {
    socket.on('new user', function (msg) {
        var user = new User(msg, socket.id);
        localUser = user;

        io.emit('created user', user);
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