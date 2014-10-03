var socketio = require("socket.io");
var _ = require("underscore");
var io;
var guestNumber = 1;
var nicknames = {};
var namesUsed = {};
var currentRoom = {};

exports.listen = function(server) {
	io = socketio.listen(server);
	io.set('log level', 1);

	io.sockets.on('connection', function (socket) {
		guestNumber = assignGuestName(socket, guestNumber,nicknames, namesUsed);
	 	joinRoom(socket, 'Lobby');
		handleMessageBroadcasting(socket, nicknames);
		handleRoomJoining(socket);
		socket.on('rooms', function() {
			socket.emit('rooms', io.sockets.manager.rooms);
		});

		handleClientDisconnection(socket, nicknames, namesUsed);

		setInterval(function(){
			var onlineUsersId = io.nsps['/'].connected;
			var size = Object.size(onlineUsersId);
			var onlineUsers = "";
			if(size > 1){
				for (var socketId in onlineUsersId) {
					if (socketId != socket.id)
		    		onlineUsers += (nicknames[socketId] + " ");
				}
				onlineUsers = onlineUsers.substring(0,onlineUsers.length-1)
			}
			socket.emit('onlineUsers', onlineUsers);
		}, 1000);
	});
}

function assignGuestName(socket, guestNumber, nicknames, namesUsed) {
	var name = 'Guest' + guestNumber;
	nicknames[socket.id] = name;
	socket.emit('nameResult', {
	success: true,
	name: name
	});
	namesUsed[name] = socket.id;
	return guestNumber + 1;
}

function joinRoom(socket, room) {
	socket.join(room);
	currentRoom[socket.id] = room;
	socket.emit('joinResult', {room: room});
	socket.broadcast.to(room).emit('message', {
		text: nicknames[socket.id] + ' has joined ' + room + '.'
	});
}

function handleMessageBroadcasting(socket) {
	socket.on('message', function (message) {
		socket.broadcast.to(message.room).emit('message', {
			text: nicknames[socket.id] + ': ' + message.text
		});
	});
}

function handleRoomJoining(socket) {
	socket.on('join', function(room) {
		socket.leave(currentRoom[socket.id]);
		joinRoom(socket, room.newRoom);
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