module.exports = Square;

function Square(x, y, size) {
    this.x = x;
    this.y = y;
    this.size = size;

    this.owner = -1;
    this.points = 0;

    this.mainX = null;
    this.mainY = null;
    this.mainSize = 0;

    this.traversePriority = -1;
}

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
    arr.forEach(function (e) {
        if (this.sameSquare(e)) {
            return true;
        }
    }, this);

    return false;
};