var socketio = require("socket.io");
var _ = require("underscore");
var io;
var guestNumber = 1;
var nicknames = {};
var namesUsed = {};
var currentRoom = {};

exports.listen = function(server){
	io = socketio(server);
	io.set('log level', 1);

	io.on('connection', function(socket){
		guestNumber = assignGuestName(socket);
		socket.join('lobby');
		handleMessageUnicasting(socket);
		handleClientDisconnection(socket);

		setInterval(function(){
			var onlineUsersId = io.nsps['/'].connected;
			var size = Object.size(onlineUsersId);
			var onlineUsers = "";
			if(size > 1){
				for (var socketId in onlineUsersId) {
					if (socketId != socket.id)
		    		onlineUsers += (nicknames[socketId].toString() + " ");
				}
				onlineUsers = onlineUsers.substring(0,onlineUsers.length-1)
			}
			socket.emit('onlineUsers', onlineUsers);
		}, 1000);
	});
}

function assignGuestName(socket){
	var name = 'Guest' + guestNumber;
	nicknames[socket.id] = name;
	socket.emit('nameResult', {
		success: true,
		name: name
	});
	namesUsed[name] = socket.id;
	return guestNumber + 1;
}



function handleMessageUnicasting(socket) {
	socket.on('message', function(message) {
		var patnerId = namesUsed[message.patnerName]
	console.log("message recieved");
	console.log('patner id = '+patnerId);

		socket.emit(nicknames[patnerId], {
			text: message.text,
			from: nicknames[socket.id],
			timeStamp: message.timeStamp
		});
	});
}

function handleClientDisconnection(socket) {
	socket.on('disconnect', function() {
		var name = nicknames[socket.id];
		delete namesUsed[name];
		delete nicknames[socket.id];
	});
}

Object.size = function(Obj){
	var size = 0, key;
	for(key in Obj){
		if(Obj.hasOwnProperty(key))
			size++;
	}
	return size;
}