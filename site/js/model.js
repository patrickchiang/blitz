function Board(json) {
    this.width = json.width;
    this.height = json.height;
    this.mediums = json.mediums;
    this.larges = json.larges;

    this.squares = [];
    this.aux = [];

    for (var i = 0; i < json.squares.length; i++) {
        var squareJSON = json.squares[i];
        var square = new Square(squareJSON);
        this.squares.push(square);
    }

    for (var i = 0; i < json.aux.length; i++) {
        var auxJSON = json.aux[i];
        var auxSquares = new Square(auxJSON);
        this.aux.push(auxSquares);
    }
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
};

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
    a = this.findRootSquare(a);
    b = this.findRootSquare(b);

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
            if (neighbor.traversePriority == -1 && a.owner == neighbor.owner) {
                neighbor.traversePriority = nodeSquare.traversePriority + 1;
                pathQueue.push(neighbors[i]);
            }
        }
    }

    var priority = b.traversePriority, path = [], backtrackSquare = b;
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

    // reset the priorities
    for (var i = 0; i < this.squares.length; i++) {
        this.squares[i].traversePriority = -1;
    }

    console.log(printPath(path));
};

function Square(json) {
    this.x = json.x;
    this.y = json.y;
    this.size = json.size;

    this.owner = json.owner;
    this.points = json.points;

    this.mainX = json.mainX;
    this.mainY = json.mainY;
    this.mainSize = json.mainSize;

    this.traversePriority = json.traversePriority;
};

Square.prototype.equals = function (other) {
    return this.x == other.x && this.y == other.y;
};

Square.prototype.sameSquare = function (other) {
    // if other is null
    if (other == null) {
        return false;
    }

    // Same square
    if (this.equals(other)) {
        return true;
    }

    // One of the squares is the main
    if (this.x == other.mainX && this.y == other.mainY) {
        return true;
    }

    if (this.mainX == other.x && this.mainY == other.y) {
        return true;
    }

    // Neither square is main
    if (this.mainX == other.mainX && this.mainY == other.mainY) {
        return this.mainX != null;
    }

    return false;
};

Square.prototype.rootInSameArray = function (arr) {
    for (var i = 0; i < arr.length; i++) {
        if (this.sameSquare(arr[i])) {
            return true;
        }
    }
    return false;
};

/**
 * Utilities
 */

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function printPath(path) {
    var display = '';
    for (var i = path.length - 1; i >= 0; i--) {
        display += path[i].x + ',' + path[i].y + ' -> ';
    }
    return display + 'end';
}