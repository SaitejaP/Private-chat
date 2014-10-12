var socketio = require("socket.io");
var io;
var nicknames = {};
var sockets = {};
var emailIds = {};

var mongoose = require("mongoose");

var MessageSchema = new mongoose.Schema({
	text: String,
	patner1: String,
	patner2: String,
	timestamp: Date,
	from: Number
});

var SignupSchema = new mongoose.Schema({
	emailId: String,
	name: String
});

var Message = mongoose.model("Message", MessageSchema);
var Signup = mongoose.model("signup", SignupSchema);

mongoose.connect('localhost:27017', function(){
	console.log('mongoose connected');
});

Signup.find({})
	.exec(function(errr, docs){
		for(var index in docs){
			doc = docs[index];
			emailIds[doc.emailId] = doc.name;
		} 
	});

exports.listen = function(server) {
	io = socketio.listen(server);
	io.set('log level', 1);

	io.sockets.on('connection', function (socket) {

		assignGuestName(socket);
		handleMessageBroadcasting(socket);
		sendPreviousMessages(socket);
		handleClientDisconnection(socket);

		setInterval(function(){
			var onlineUsersId = io.nsps['/'].connected;
			var size = Object.size(onlineUsersId);
			var onlineUsers = [];
			if(size > 1){
				for (var socketId in onlineUsersId) {
					if (socketId != socket.id)
		    		onlineUsers.push(nicknames[socketId]);
				}
			}
			socket.emit('onlineUsers', onlineUsers);
		}, 1000);
	});
}

function assignGuestName(socket) {
	socket.on('assign name',function(user){
		var checkname = emailIds[user.email];
		if(checkname !== undefined) {					/*email id exists with a name*/
			if (checkname === user.name) {
				if(sockets[user.name] !== undefined) {					/*already live*/
					socket.emit('nameResult', {
						success: false,
						message: 'An Instance is already live. Please close it.'
					});
				}else{					/*revisit, welcome back*/	
					socket.emit('nameResult', {
						success: true,
						name: user.name,
						message: 'welcome back ' + user.name
					});
					nicknames[socket.id] = user.name;
					sockets[user.name] = socket;
					joinRoom(socket, 'Lobby');
				}
			}else{			/*email id already registered, recheck your name*/
				socket.emit('nameResult', {
					success: false,
					message: 'email id already registered, recheck your name.'
				});
			}
		}else{
			if(isNameReapeted(user.name)){			/*name already taken*/
				socket.emit('nameResult', {
					success: false,
					message: 'Name already taken. Try another name.'
				});
			}else{			/* no name/emailid coincidence - new entry*/
				emailIds[user.email] = user.name;
				nicknames[socket.id] = user.name;
				sockets[user.name] = socket;
				socket.emit('nameResult', {
					success: true,
					name: user.name
				});
				var signup = new Signup({
					emailId: user.email,
					name: user.name
				});
				signup.save(function(err, doc){
					if(err){
						console.log("signup details not saved")
						return;
					}
					console.log("new user was added")
				});
				joinRoom(socket, 'Lobby');
			}
		}
	});
}

function isNameReapeted (name) {
	for(var index in nicknames) {
		if(nicknames[index] == name) {
			return true;
		}else {
			return false;
		}
	}
}

function joinRoom(socket, room) {
	socket.join(room);
}

function handleMessageBroadcasting(socket) {
	socket.on('message', function (msgPack) {
		sockets[msgPack.sender].emit('message', {
			text: msgPack.text,
			sender: nicknames[socket.id],
			timestamp: msgPack.timestamp
		});

		var patnerId = sockets[msgPack.sender].id;

		if(socket.id > patnerId){
			var patner1 = nicknames[socket.id];
			var patner2 = nicknames[patnerId]
		}else{
			var patner1 = nicknames[patnerId];
			var patner2 = nicknames[socket.id];
		}

		var from = (patner2 == nicknames[socket.id]) ? 2 : 1;

		var message = new Message({
			text: msgPack.text,
			patner1: patner1,
			patner2: patner2,
			timestamp: msgPack.timestamp,
			from: from
		});

		message.save(function(err, doc){
			if(err) return console.log("Error saving Document")
			console.log(doc + "Document Saved");
		});

	});
}

function handleClientDisconnection(socket) {
	socket.on('disconnect', function() {
		var name = nicknames[socket.id];
		delete sockets[name];
		delete nicknames[socket.id];
	});
}

function sendPreviousMessages(socket){
	socket.on("send previous messages", function(patnerName){
		var patnerId = sockets[patnerName].id;

		if(socket.id > patnerId){
			var patner1 = nicknames[socket.id];
			var patner2 = nicknames[patnerId];
		}else{
			var patner1 = nicknames[patnerId];
			var patner2 = nicknames[socket.id];
		}

		var from = (patner2 == nicknames[patnerId]) ? 2 : 1;

		Message.find({patner1: patner1, patner2: patner2})
			.sort('-timestamp')
			.select('text patner1 patner2 timestamp from')
			.limit(15)
			.sort({"timestamp": 1})
			.exec(function(err, docs){
				if(err) throw err;
				socket.emit("load old message", docs);
			});
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