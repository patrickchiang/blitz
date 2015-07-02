/**
 * Module imports
 */

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);


/**
 * User Management
 */

var localUser;

/**
 * User Definitions
 */
function User(name, id) {
    this.name = name;
    this.color = 'blue';
    this.id = id;
}

/**
 * Views
 */

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/site/index.html');
});


/**
 * Connection Management
 */

io.on('connection', function (socket) {
    socket.on('new user', function (msg) {
        var user = new User(msg, socket.id);
        localUser = user;

        console.log(JSON.stringify(user));
        io.emit('created user', user);
    });

    socket.on('disconnect', function () {
        io.emit('delete user', socket.id);
    });
});

/**
 * Static views
 */

app.use('/', express.static(__dirname + '/site'));

/**
 * Initialize server
 */
http.listen(3000, function () {
    console.log('listening on port 3000');
});