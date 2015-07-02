var socket = io();

socket.on('connect', function () {
    socket.emit('new user', 'Patrick');
});