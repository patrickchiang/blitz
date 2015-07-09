module.exports = User;

function User(name, id, color) {
    this.name = name;
    this.color = color;
    this.id = id;
}

User.prototype.init = function (board) {
    // get a square
    var base = board.randomEmptySquare();

    base.points = 99;
    base.owner = this.id;

    return base;
};

User.prototype.destroy = function (board) {
    return board.scrubUser(this.id);
};