/**
 * vars
 */

var board,
    scale = 1,
    lastScale = 1,
    tickRate = 10,
    keyArrowUp = false,
    keyArrowDown = false,
    keyArrowLeft = false,
    keyArrowRight = false,
    user = [],
    selectedSquare = null,
    targetedSquare = null,
    markedTargets = [],
    localUser = null,
    selectRate = 0.5,
    attackTickRate = 100,
    mouseDownSquare = null;


/**
 * Load sound
 */

var soundWeapon = new Howl({
    src: ['../sounds/P90.wav'],
    volume: 0.05
});

var soundSelect = new Howl({
    src: ['../sounds/dryfire.wav'],
    volume: 0.05
});

var soundCancel = new Howl({
    src: ['../sounds/static.wav'],
    sprite: {
        cancel: [2000, 400]
    },
    volume: 0.1
});

/**
 * Sockets
 */

var socket = io();

socket.on('connect', function () {
    socket.emit('new user', 'Patrick');
});

socket.on('updated board', function (board) {
    console.log(board);
});

socket.on('send board', function (msgBoard) {
    console.log(msgBoard);
    board = new Board(msgBoard);
    redrawBoard();
});

socket.on('send users', function (reply) {
    localUser = reply.local;
    users = reply.users;
    console.log(users);

    updateUsers();
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

var squareGraphics, squareTextures = {};

function updateUsers() {
    squareTextures = {};

    squareGraphics = {
        smallEmpty: new SquareTexture(1, 0xD7FCFB),
        mediumEmpty: new SquareTexture(2, 0xD7FCFB),
        largeEmpty: new SquareTexture(3, 0xD7FCFB)
    };

    for (var i = 0; i < users.length; i++) {
        var user = users[i];
        squareGraphics['small' + user.id] = new SquareTexture(1, user.color);
        squareGraphics['medium' + user.id] = new SquareTexture(2, user.color);
        squareGraphics['large' + user.id] = new SquareTexture(3, user.color);
    }

    console.log(squareGraphics);

    for (var key in squareGraphics) {
        if (squareGraphics.hasOwnProperty(key)) {
            var square = squareGraphics[key];
            var graphic = new PIXI.Graphics();
            graphic.lineStyle(4, 0xFFFFFF, 1);
            graphic.beginFill(square.color, 1);
            graphic.drawRect(0, 0, SIZE * square.size, SIZE * square.size);
            graphic.endFill();

            var texture = graphic.generateTexture();
            squareTextures[key] = texture;
        }
    }

    redrawBoard();
};

function tintSquareInside(color, square, alpha) {
    var graphic = new PIXI.Graphics();
    //graphic.lineStyle(0, color, 1);
    graphic.beginFill(color, alpha);
    graphic.drawRect(0, 0, SIZE * square.size - 4, SIZE * square.size - 4);
    graphic.endFill();


    var texture = graphic.generateTexture();
    var sprite = new PIXI.Sprite(texture);
    return sprite;
};

function clearBorders() {
    for (var i = 0; i < markedTargets.length; i++) {
        grid.removeChild(markedTargets[i]);

        renderer.render(stage);
    }
    markedTargets = [];
};

function redrawGridText(square) {
    var gridText = square.pointText;
    gridText.updateTransform();
    gridText.position.x = SIZE * (square.x + 0.5) - gridText.textWidth / 2 + (square.size - 1) / 2 * SIZE;
    gridText.position.y = SIZE * (square.y + 0.5) - gridText.textHeight / 2 + (square.size - 1) / 2 * SIZE;
    gridText.updateTransform();
};

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

        // points text
        for (var i = 0; i < board.squares.length; i++) {
            var square = board.squares[i];

            if (square.pointText)
                grid.removeChild(square.pointText);

            var gridText = new PIXI.extras.BitmapText('' + square.points, {
                font: '15px Arial',
                align: 'center',
                tint: 0x000000
            });
            square.pointText = gridText;
            grid.addChild(gridText);

            redrawGridText(square);
        }

        renderer.render(stage);
    }

    // render squares
    for (var i = 0; i < board.squares.length; i++) {
        var square = board.squares[i];

        var sprite;

        if (square.owner === -1) {
            if (square.size == 3)
                sprite = new PIXI.Sprite(squareTextures['largeEmpty']);
            else if (square.size == 2)
                sprite = new PIXI.Sprite(squareTextures['mediumEmpty']);
            else
                sprite = new PIXI.Sprite(squareTextures['smallEmpty']);
        } else {
            if (square.size == 3)
                sprite = new PIXI.Sprite(squareTextures['large' + square.owner]);
            else if (square.size == 2)
                sprite = new PIXI.Sprite(squareTextures['medium' + square.owner]);
            else
                sprite = new PIXI.Sprite(squareTextures['small' + square.owner]);
        }

        grid.addChild(sprite);
        square.sprite = sprite;

        sprite.position.x = SIZE * square.x;
        sprite.position.y = SIZE * square.y;

        sprite.interactive = true;
        sprite.on('click', squareClicked(square));
        sprite.on('mousedown', squareMouseDown(square));
        sprite.on('mouseup', squareMouseUp(square));
    }

    renderer.render(stage);
}

/**
 * Input handling
 */

function squareMouseDown(square) {
    return function () {
        var clickedSquare = board.squareAt(square.x, square.y);
        mouseDownSquare = clickedSquare;

        if (selectedSquare || clickedSquare.owner != localUser.id) {
            return;
        }

        clearBorders();

        var inRange = board.calculateRange(mouseDownSquare);

        for (var i = 0; i < inRange.length; i++) {
            var neighbor = board.findRootSquare(inRange[i]);
            var borderSprite;

            if (neighbor.sameSquare(mouseDownSquare))
                borderSprite = tintSquareInside(0xFFFFFF, mouseDownSquare, 0.7);
            else
                borderSprite = tintSquareInside(localUser.color, neighbor, 0.5);

            grid.addChild(borderSprite);
            markedTargets.push(borderSprite);

            borderSprite.position.x = SIZE * neighbor.x + 4;
            borderSprite.position.y = SIZE * neighbor.y + 4;

            renderer.render(stage);
        }

        soundSelect.play();
    };
}

function squareMouseUp(square) {
    return function () {
        var clickedSquare = board.squareAt(square.x, square.y);
        if (mouseDownSquare && mouseDownSquare.sameSquare(clickedSquare)) {
            return;
        }

        console.log(mouseDownSquare);
        if (mouseDownSquare.owner != localUser.id) {
            return;
        }

        clearBorders();

        // make sure this is in range
        if (board.isInRange(mouseDownSquare, clickedSquare)) {
            var distance = board.findPath(mouseDownSquare, clickedSquare).length;
            moveTroops(distance, mouseDownSquare, clickedSquare);
        } else {
            // play cancel sound
            soundCancel.play('cancel');
        }

        targetedSquare = null;
        selectedSquare = null;
        mouseDownSquare = null;
    };
}

function squareClicked(square) {
    return function () {
        var clickedSquare = board.squareAt(square.x, square.y);

        if (!selectedSquare) {  // nothing selected, select it
            // check if valid selection
            if (clickedSquare.owner == localUser.id) {
                selectedSquare = clickedSquare;
            }
        } else if (selectedSquare.sameSquare(clickedSquare)) {   // already selected, deselect
            clearBorders();

            // check if it's still yours
            if (clickedSquare.owner == localUser.id) { // valid
                selectedSquare = null;

            } else {    // this is now enemy territory
                selectedSquare = null;
            }
        } else {    // something else already selected, this is target
            clearBorders();

            // make sure this is in range
            if (board.isInRange(selectedSquare, clickedSquare)) {
                targetedSquare = clickedSquare;
                var distance = board.findPath(selectedSquare, targetedSquare).length;
                moveTroops(distance, selectedSquare, targetedSquare);
            } else {
                // play cancel sound
                soundCancel.play('cancel');
            }

            targetedSquare = null;
            selectedSquare = null;
        }
    };
}

function moveTroops(distance, from, to) {
    // determine amount of troops to move over
    var troops = Math.ceil(from.points * selectRate);

    if (!from.moving) {
        from.moving = [to];
    } else if (!to.rootInSameArray(from.moving)) {
        from.moving.push(to);
    } else {
        to = null;
        from = null;
        return;
    }


    // assume valid move
    if (to.owner == localUser.id) { // friendly
        transferTick(troops, from, to, attackTickRate * Math.sqrt(distance));
    } else {    // enemy
        attackTick(troops, from, to, attackTickRate * Math.sqrt(distance));
    }
}

function attackTick(timesLeft, from, to, rate) {
    if (timesLeft == 0 || from.points <= 0) {
        for (var i = 0; i < from.moving.length; i++) {
            if (from.moving[i].sameSquare(to)) {
                from.moving.splice(i, 1);
            }
        }
        return;
    }

    // vanquished square
    if (to.points == 0 || to.owner == from.owner) {
        to.owner = localUser.id;

        var sprite = to.sprite;
        grid.removeChild(sprite);

        if (to.size == 3)
            sprite = new PIXI.Sprite(squareTextures['large' + from.owner]);
        else if (to.size == 2)
            sprite = new PIXI.Sprite(squareTextures['medium' + from.owner]);
        else
            sprite = new PIXI.Sprite(squareTextures['small' + from.owner]);

        grid.addChildAt(sprite, 0);

        sprite.position.x = SIZE * to.x;
        sprite.position.y = SIZE * to.y;

        sprite.interactive = true;
        sprite.on('click', squareClicked(to));
        sprite.on('mousedown', squareMouseDown(to));
        sprite.on('mouseup', squareMouseUp(to));

        transferTick(timesLeft, from, to, rate);
        return;
    }

    from.points -= 1;
    to.points -= 1;

    from.pointText.text = from.points;
    to.pointText.text = to.points;
    redrawGridText(from);
    redrawGridText(to);

    renderer.render(stage);
    soundWeapon.play();

    setTimeout(function () {
        attackTick(timesLeft - 1, from, to, rate);
    }, rate);
}

function transferTick(timesLeft, from, to, rate) {
    if (timesLeft == 0 || from.points <= 0) {
        for (var i = 0; i < from.moving.length; i++) {
            if (from.moving[i].sameSquare(to)) {
                from.moving.splice(i, 1);
            }
        }
        return;
    }

    if (to.owner != from.owner) {
        attackTick(timesLeft, from, to, rate);
    }

    from.points -= 1;
    to.points += 1;

    from.pointText.text = from.points;
    to.pointText.text = to.points;
    redrawGridText(from);
    redrawGridText(to);

    renderer.render(stage);
    soundSelect.play();

    setTimeout(function () {
        transferTick(timesLeft - 1, from, to, rate);
    }, rate);
}

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
    // redraw canvas
    redrawBoard();
});


/**
 * Utilities
 */

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}