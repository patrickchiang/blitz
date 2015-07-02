/**
 * Module imports
 */

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

/**
 * Views
 */

app.get('/', function (req, res) {
    res.json('Hello World!');
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