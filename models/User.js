module.exports = User;

function User(name, id) {
    this.name = name;
    this.color = 'blue';
    this.id = id;
};

User.prototype.init = function (board) {
    // get a square
    var base = board.randomEmptySquare();
    base.points = 99;
    base.owner = this.id;
};