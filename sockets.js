function Socket(io)
{
io.sockets.on('connection', function(socket){
	socket.emit('hello', { data : 'Hello to you' });
});
}

module.exports.Socket = Socket;