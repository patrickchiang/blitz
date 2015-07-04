module.exports = Board;

var Square = require('./Square.js');

function Board(width, height, mediums, larges) {
    this.width = width;
    this.height = height;
    this.mediums = mediums;
    this.larges = larges;

    this.squares = [];
    this.aux = [];
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

        // found valid enlargement candidate
        candidate.size = 2;

        var removedSquares = [];

        removedSquares.push(this.removeSquare(candidate.x + 1, candidate.y)[0],
            this.removeSquare(candidate.x, candidate.y + 1)[0],
            this.removeSquare(candidate.x + 1, candidate.y + 1)[0]);

        for (var j = 0; j < removedSquares.length; j++) {
            removedSquares[j].mainX = candidate.x;
            removedSquares[j].mainY = candidate.y;
            removedSquares[j].mainSize = candidate.size;
            console.log(candidate.x);
        }

        Array.prototype.push.apply(this.aux, removedSquares);
        console.log('applied');
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

        var removedSquares = [];

        removedSquares.push(this.removeSquare(candidate.x + 1, candidate.y)[0],
            this.removeSquare(candidate.x + 2, candidate.y)[0],
            this.removeSquare(candidate.x, candidate.y + 1)[0],
            this.removeSquare(candidate.x + 1, candidate.y + 1)[0],
            this.removeSquare(candidate.x + 2, candidate.y + 1)[0],
            this.removeSquare(candidate.x, candidate.y + 2)[0],
            this.removeSquare(candidate.x + 1, candidate.y + 2)[0],
            this.removeSquare(candidate.x + 2, candidate.y + 2)[0]);

        for (var j = 0; j < removedSquares.length; j++) {
            removedSquares[j].mainX = candidate.x;
            removedSquares[j].mainY = candidate.y;
            removedSquares[j].mainSize = candidate.size;
            console.log(candidate.x);
        }

        Array.prototype.push.apply(this.aux, removedSquares);
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
    for (var i = 0; i < this.height; i++) {
        for (var j = 0; j < this.width; j++) {
            //if (this.isSquareExist(j, i)) {
            //    print += this.squareSize(j, i);
            //} else {
            //    print += ' ';
            //}
            print += this.squareSize(j, i);
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

    for (var i = 0; i < this.aux.length; i++) {
        if (this.aux[i].x == x && this.aux[i].y == y) {
            return this.aux[i].mainSize;
        }
    }
    return 0;
}

Board.prototype.numberOfSquares = function (size) {
    if (!size)
        return this.squares.length;

    var count = 0;
    for (var i = 0; i < this.squares.length; i++) {
        if (this.squares[i].size == size) {
            count++;
        }
    }
    return count;
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
            return this.squares.splice(i, 1);
        }
    }
};

/**
 * Utilities
 */

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}