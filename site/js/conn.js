var board,
    scale = 1,
    lastScale = 1,
    cameraX = 0,
    cameraY = 0,
    tickRate = 10,
    keyArrowUp = false,
    keyArrowDown = false,
    keyArrowLeft = false,
    keyArrowRight = false;

/**
 * Sockets
 */

var socket = io();

socket.on('connect', function () {
    socket.emit('new user', 'Patrick');
});

socket.on('created user', function (user) {
    console.log(user);
});

socket.on('send board', function (msgBoard) {
    board = msgBoard;
    redrawBoard();
});

/**
 * Board rendering
 */

var canvasView = document.getElementById('main');
var renderer = new PIXI.CanvasRenderer(window.innerWidth, window.innerHeight - 4, {
    backgroundColor: 0xD7FCFB,
    view: canvasView
});
document.body.appendChild(renderer.view);

var stage = new PIXI.Container();
var grid = new PIXI.Container();
stage.addChild(grid);

renderer.render(stage);

function redrawBoard() {
    var SIZE = 40;

    for (var i = 0; i < board.squares.length; i++) {
        var square = board.squares[i];

        var graphics = new PIXI.Graphics();
        graphics.lineStyle(4, 0xFFFFFF, 1);
        graphics.beginFill(square.color, 1);
        graphics.drawRect(SIZE * square.x, SIZE * square.y, SIZE * square.size, SIZE * square.size);
        graphics.endFill();

        grid.addChild(graphics);
    }

    renderer.render(stage);
}

/**
 * Input handling
 */

canvasView.addEventListener("wheel", function (e) {
    e.preventDefault();

    // delta scaling
    scale += e.deltaY * 0.005;

    // limit scaling
    if (scale >= 1.5) {
        scale = 1.5;
    } else if (scale <= 0.5) {
        scale = 0.5;
    }

    // step
    if (lastScale / scale >= 1.05 || scale / lastScale >= 1.05) {
        lastScale = scale;

        grid.scale.x = 1 / scale;
        grid.scale.y = 1 / scale;

        var x = e.clientX, y = e.clientY;

        var interactionData = new PIXI.interaction.InteractionData();

        // initial context
        interactionData.global = new PIXI.Point(x, y);
        var beforeTransform = interactionData.getLocalPosition(grid);

        grid.updateTransform();
        interactionData.global = new PIXI.Point(x, y);
        var afterTransform = interactionData.getLocalPosition(grid, new PIXI.Point(x, y));

        // transform
        grid.position.x += (afterTransform.x - beforeTransform.x) * grid.scale.x;
        grid.position.y += (afterTransform.y - beforeTransform.y) * grid.scale.y;

        grid.updateTransform();
        renderer.render(stage);
    }

    return false;

}, false);

var tick = function () {
    var deltaX = 0, deltaY = 0;
    var SPEED = 15;

    if (keyArrowUp) {
        deltaY += SPEED;
    } else if (keyArrowDown) {
        deltaY -= SPEED;
    } else if (keyArrowLeft) {
        deltaX += SPEED;
    } else if (keyArrowRight) {
        deltaX -= SPEED;
    } else {
        setTimeout(tick, tickRate);
        return;
    }

    grid.position.x += deltaX;
    grid.position.y += deltaY;
    grid.updateTransform();
    renderer.render(stage);

    setTimeout(tick, tickRate);
};

tick();

document.onkeydown = function (e) {

    switch (e.keyCode) {
        case 38:
        case 87:
            keyArrowUp = true;
            break;
        case 40:
        case 83:
            keyArrowDown = true;
            break;
        case 37:
        case 65:
            keyArrowLeft = true;
            break;
        case 39:
        case 68:
            keyArrowRight = true;
            break;
        default:
            break;
    }
};

document.onkeyup = function (e) {
    switch (e.keyCode) {
        case 38:
        case 87:
            keyArrowUp = false;
            break;
        case 40:
        case 83:
            keyArrowDown = false;
            break;
        case 37:
        case 65:
            keyArrowLeft = false;
            break;
        case 39:
        case 68:
            keyArrowRight = false;
            break;
        default:
            break;
    }
}

window.addEventListener('resize', function (e) {
    redrawBoard();
});
