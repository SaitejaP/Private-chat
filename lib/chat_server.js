var socketio = require("socket.io");
var io;
var guestNumber = 1;
var nicknames = {};
var namesUsed = [];
var currentRoom = {};

exports.listen = function(server){
	io = socketio(server);
	io.set('log level', 1);


	io.on('connection', function(socket){
		guestNumber = assignGuestName(socket, guestNumber, nicknames, namesUsed);
		joinRoom(socket, 'lobby');
		handleMessageBroadcasting(socket, nicknames);
		handleNameChangingAttempts(socket, nicknames, namesUsed);
		handleRoomJoining(socket);

		socket.on('rooms', function(){
//			socket.emit('rooms', io.adapter.rooms);
console.log(io.sockets.adapter.rooms);
		});

		handleClientDisconnection(socket, nicknames, namesUsed);
	});
}

function assignGuestName(socket, guestNumber, nicknames, namesUsed){
	var name = 'Guest' + guestNumber;
	nicknames[socket.id] = name;
	socket.emit('nameResult', {
		success: true,
		name: name
	});
	namesUsed.push(name);
	return guestNumber + 1;
}

function joinRoom (socket, room) {
	socket.join(room);
	currentRoom[socket.id] = room;
	socket.emit('joinResult', {room: room});
	socket.broadcast.to(room).emit('message', {
		text: nicknames[socket.id] + ' has joined ' + room
	});
	var usersInRoomSummary = "Users in this room: "

		for (var socketId in io.nsps['/'].adapter.rooms[room]) {
    		usersInRoomSummary += (nicknames[socketId].toString() + " ");
		}

		console.log(usersInRoomSummary);

		socket.emit('message', {text: usersInRoomSummary});
}

function handleNameChangingAttempts (socket, nicknames, namesUsed) {
	socket.on('nameAttempt', function  (name) {
		if (name.indexOf("guest") == 0) {
			socket.emit('nameResult', {
				success: false,
				message: "name cannot start with guest"
			});
		} else {
			if(namesUsed.indexOf("name") == -1) {
				var previousName = nicknames[socket.id];
				var previousNameIndex = namesUsed.indexOf(previousName);
				namesUsed.push(name);
				nicknames[socket.id] = name;
				delete namesUsed[previousNameIndex];
				socket.emit('nameResult', {
					success: true,
					name: name
				});
				socket.broadcast.to(currentRoom[socket.id]).emit('message', {text: previousName + " is now known as " + name + "." });
			} else {
				socket.emit('nameResult', {success: false, message: name + " is already used. Try another one."});
			}
		}
	});
}

function handleRoomJoining(socket) {
	socket.on('join', function(room){
		socket.leave(currentRoom[socket.id]);
		joinRoom(socket, room.newRoom);
	});
}

function handleMessageBroadcasting(socket) {
	socket.on('message', function(message) {
		socket.broadcast.to(currentRoom[socket.id]).emit('message', {
			text: nicknames[socket.id] + ': ' + message.text
		});
	});
}

function handleClientDisconnection(socket) {
	socket.on('disconnect', function() {
		var nameIndex = namesUsed.indexOf(nicknames[socket.id]);
		delete namesUsed[nameIndex];
		delete nicknames[socket.id];
	});
}