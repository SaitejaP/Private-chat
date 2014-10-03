function divEscapedContentElement (message) {
	return $('<div></div>').text(message);
}

function divSystemContentElement (message) {
	return $('<div></div>').html(message);
}

function processUserInput(chatApp, socket) {
	var message = $('#send-message').val();
	var systemMessage;
		$('#messages').append(divEscapedContentElement(message));
		$('#messages').scrollTop($('#messages').prop('scrollHeight'));
	console.log("message added");
		$('#send-message').val('');
		chatApp.sendMessage(patnerName, message, Date.now()); 
	console.log("message sent");

}

var socket = io();

$(document).ready(function() {
	var chatApp = new Chat(socket);

	socket.on('nameResult', function(result) { 
		var message;
		window.name = result.name;
		console.log(name);
		if (result.success) {
			message = 'You are now known as ' + result.name + '.';
		} else {
			message = result.message;
		}
		$('#messages').append(divSystemContentElement(message));
	});

	socket.on('joinResult', function(result) {
		$('#room').text(result.room);
		$('#messages').append(divSystemContentElement('Room changed.'));
	});

	socket.on('message', function (message) { 
		$('#messages').append(divSystemContentElement(message.text));
	});

	socket.on('onlineUsers', function(onlineUsers){	
		if(onlineUsers != ""){
			var onlineUsersArr = onlineUsers.split(" ");
			var list = "<ul>";
			for(var index in onlineUsersArr){
				list += "<li>" + onlineUsersArr[index] + "</li>";
			}
			list += "</ul>";
		}else{
			var list = "No Users Online";
		}
		$('#room-list div').replaceWith(divSystemContentElement(list));
		$('#room-list div ul li').click(function() {
			console.log("clicked"); 
			window.patner = $(this).text();
			console.log(patner);
			$('#send-message').focus();
		});		
	});

	console.log("name "+ window.name);

	socket.on(name, function(message){
		console.log('gotMessage');
		window.messages[message.from].push({
			message: message.text,
			timestamp: message.timestamp
		});
	});

	$('#send-message').focus();

	$('#send-form').submit(function() {
		processUserInput(chatApp, socket);
		return false;
	});
});