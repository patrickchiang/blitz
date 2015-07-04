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
        }

        Array.prototype.push.apply(this.aux, removedSquares);
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
};

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
};

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
};

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
};

Board.prototype.squareAt = function (x, y) {
    for (var i = 0; i < this.squares.length; i++) {
        if (this.squares[i].x == x && this.squares[i].y == y) {
            return this.squares[i];
        }
    }

    for (var i = 0; i < this.aux.length; i++) {
        if (this.aux[i].x == x && this.aux[i].y == y) {
            return this.aux[i];
        }
    }

    return null;
};

Board.prototype.auxOf = function (square) {
    var squares = [];
    for (var i = 0; i < this.aux.length; i++) {
        if (this.aux[i].mainX == square.x && this.aux[i].mainY == square.y) {
            squares.push(this.aux[i]);
        }
    }

    return squares;
};

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

Board.prototype.findRootSquare = function (square) {
    if (!square.mainX) {
        return square;
    }

    return this.squareAt(square.mainX, square.mainY);
}

Board.prototype.findNeighbors = function (square) {
    var rootSquare = this.findRootSquare(square), neighbors = [], checkSquares = [];

    // find main square
    checkSquares.push(rootSquare);

    // find all aux
    Array.prototype.push.apply(checkSquares, this.auxOf(rootSquare));

    // check every square in checkSquares
    for (var i = 0; i < checkSquares.length; i++) {
        var cs = checkSquares[i];

        var right = this.squareAt(cs.x + 1, cs.y);
        if (right && !right.sameSquare(cs) && !right.rootInSameArray(neighbors))
            neighbors.push(this.findRootSquare(right));

        var top = this.squareAt(cs.x, cs.y + 1);
        if (top && !top.sameSquare(cs) && !top.rootInSameArray(neighbors))
            neighbors.push(this.findRootSquare(top));

        var left = this.squareAt(cs.x - 1, cs.y);
        if (left && !left.sameSquare(cs) && !left.rootInSameArray(neighbors))
            neighbors.push(this.findRootSquare(left));

        var bottom = this.squareAt(cs.x, cs.y - 1);
        if (bottom && !bottom.sameSquare(cs) && !bottom.rootInSameArray(neighbors))
            neighbors.push(this.findRootSquare(bottom));
    }

    return neighbors;
};

Board.prototype.findPath = function (a, b) {
    // Lee algo for finding shortest path in grid
    a.traversePriority = 0;

    var pathQueue = [];
    pathQueue.push(a);

    // mark everything i can get my hands on
    while (pathQueue.length > 0) {
        var nodeSquare = pathQueue.shift();
        if (nodeSquare.equals(b)) {
            break;
        }

        var neighbors = this.findNeighbors(nodeSquare);
        for (var i = 0; i < neighbors.length; i++) {
            var neighbor = neighbors[i];
            if (neighbor.traversePriority == -1) {
                neighbor.traversePriority = nodeSquare.traversePriority + 1;
                pathQueue.push(neighbors[i]);
            }
        }
    }

    var priority = b.traversePriority;
    var path = [], backtrackSquare = b;
    // backtrack from b to a
    while (priority > 0) {
        var neighbors = this.findNeighbors(backtrackSquare);
        var minPriority = b.traversePriority;
        for (var i = 0; i < neighbors.length; i++) {
            var neighbor = neighbors[i];
            if (neighbor.traversePriority == priority - 1) {
                path.push(neighbor);
                priority--;
                backtrackSquare = neighbor;
            }
        }
    }

    console.log(printPath(path));
};

/**
 * Utilities
 */

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function printPath(path) {
    var display = '';
    for (var i = 0; i < path.length; i++) {
        display += path[i].x + ',' + path[i].y + ' -> ';
    }
    return display + 'end';
}