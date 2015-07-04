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
    console.log(msgBoard);
    board = msgBoard;
    redrawBoard();
});

/**
 * Board rendering
 */

var canvasView = document.getElementById('main');
var renderer = new PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight - 4, {
    backgroundColor: 0xD7FCFB,
    view: canvasView
});
document.body.appendChild(renderer.view);

var stage = new PIXI.Container();
var grid = new PIXI.Container();
stage.addChild(grid);

renderer.render(stage);

/**
 * Graphics -> Texture
 */

var SIZE = 40;

function SquareTexture(size, color) {
    this.size = size;
    this.color = color;
}

var smallEmpty = new SquareTexture(1, 0x858072);
var mediumEmpty = new SquareTexture(2, 0x858072);
var largeEmpty = new SquareTexture(3, 0x858072);

var squareGraphics = [new SquareTexture(1, 0x858072), new SquareTexture(2, 0x858072), new SquareTexture(3, 0x858072),
    new SquareTexture(1, 636060), new SquareTexture(2, 636060), new SquareTexture(3, 636060)
];

var squareTextures = [];

for (var i = 0; i < squareGraphics.length; i++) {
    var square = squareGraphics[i];
    var graphic = new PIXI.Graphics();
    graphic.lineStyle(4, 0xFFFFFF, 1);
    graphic.beginFill(square.color, 1);
    graphic.drawRect(0, 0, SIZE * square.size, SIZE * square.size);
    graphic.endFill();

    var texture = graphic.generateTexture();
    squareTextures.push(texture);
}

/**
 * Board drawing
 */

function redrawBoard() {
    // Debug grid numbers
    var loader = new PIXI.loaders.Loader();
    loader.add('Arial', 'fonts/Arial.fnt');
    loader.add('ArialBlack', 'fonts/Arial-hd.fnt');
    loader.once('complete', fontsLoaded);
    loader.load();
    function fontsLoaded() {
        for (var i = 0; i < board.height; i++) {
            var sideText = new PIXI.extras.BitmapText('' + i, {font: '15px ArialBlack'});
            grid.addChild(sideText);
            sideText.position.y = SIZE * (i + 0.5) - 15 / 2;
            sideText.position.x = -20;
        }

        for (var i = 0; i < board.width; i++) {
            var topText = new PIXI.extras.BitmapText('' + i, {font: '15px ArialBlack'});
            grid.addChild(topText);
            topText.position.x = SIZE * (i + 0.5) - 15 / 2;
            topText.position.y = -20;
        }

        for (var i = 0; i < board.squares.length; i++) {
            var square = board.squares[i];
            var gridText = new PIXI.extras.BitmapText('' + square.points, {font: '15px Arial'});
            grid.addChild(gridText);
            gridText.position.x = SIZE * (square.x + 0.5) - 15 / 2 + (square.size - 1) / 2 * SIZE;
            gridText.position.y = SIZE * (square.y + 0.5) - 15 / 2 + (square.size - 1) / 2 * SIZE;
        }
    }

    for (var i = 0; i < board.squares.length; i++) {
        var square = board.squares[i];

        var sprite;

        if (square.owner === -1) {
            if (square.size == 3)
                sprite = new PIXI.Sprite(squareTextures[2]);
            else if (square.size == 2)
                sprite = new PIXI.Sprite(squareTextures[1]);
            else
                sprite = new PIXI.Sprite(squareTextures[0]);
        } else {
            if (square.size == 3)
                sprite = new PIXI.Sprite(squareTextures[5]);
            else if (square.size == 2)
                sprite = new PIXI.Sprite(squareTextures[4]);
            else
                sprite = new PIXI.Sprite(squareTextures[3]);
        }

        grid.addChild(sprite);
        sprite.position.x = SIZE * square.x;
        sprite.position.y = SIZE * square.y;

        sprite.interactive = true;
        sprite.on('click', squareClicked(square));
    }

    function squareClicked(square) {
        return function () {
            console.log(square.x + ', ' + square.y);
        };
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

    var originalX = grid.position.x, originalY = grid.position.y, MARGINS = 100;

    grid.position.x += deltaX;
    grid.position.y += deltaY;

    // pan limits
    if (grid.position.x <= -board.width * SIZE / scale + window.innerWidth - MARGINS / scale && deltaX < 0) {
        grid.position.x = originalX;
    }
    if (grid.position.x >= MARGINS / scale && deltaX > 0) {
        grid.position.x = originalX;
    }

    if (grid.position.y <= -board.width * SIZE / scale + window.innerHeight - MARGINS / scale && deltaY < 0) {
        grid.position.y = originalY;
    }
    if (grid.position.y >= MARGINS / scale && deltaY > 0) {
        grid.position.y = originalY;
    }

    if (grid.position.x != originalX || grid.position.y != originalY) {
        grid.updateTransform();
        renderer.render(stage);
    }

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
