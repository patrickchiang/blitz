module.exports = Square;

//var colors = [0x636060, 0x858072, 0xA4BA8C, 0xAEEBB8];

function Square(x, y, size) {
    this.x = x;
    this.y = y;
    this.size = size;

    this.owner = -1;
    this.points = 0;
    //this.color = colors[Math.floor(Math.random() * colors.length)];

    this.mainX = null;
    this.mainY = null;
    this.mainSize = 0;

    this.traversePriority = -1;
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