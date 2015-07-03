module.exports = Square;

var colors = [0x636060, 0x858072, 0xA4BA8C, 0xAEEBB8];

function Square(x, y, size) {
    this.x = x;
    this.y = y;
    this.size = size;

    this.owner = 0;
    this.points = 0;
    this.color = colors[Math.floor(Math.random() * colors.length)];
};