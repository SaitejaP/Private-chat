var app = angular.module("chatApp", []);

app.factory("socket", function(){
	var socket = io.connect('http://localhost:3000/');;
	return socket;
});

app.filter('notMe', function () {
	return function (input, scope) {
		return input == scope.name ? "" : input;
	}
});

app.controller("chatController", ['$scope', 'socket', '$location', '$anchorScroll', function($scope, socket, $location, $anchorScroll){
	$scope.patner = '';
	$scope.name = '';
	$scope.msgs = [];
	$scope.onlineUsers = [];
	$scope.signup = function() {
		var name = sanitize(signupForm.userName.value);
		var email = sanitize(signupForm.userEmail.value);
		socket.emit('assign name', {name: name, email: email});
	}

	$scope.sendMsg = function(){
		if($scope.onlineUsers.indexOf($scope.patner) == -1){
			alert("select a user");
		}else{
			var text = sanitizeText(textbox.msgText.value);			
			if(text !== ""){
				var msgPack = {
					timestamp: Date.now(),
					text: text,
					sender: $scope.patner
				};
				socket.emit('message', msgPack);
				$scope.msgs.push({
					timestamp: msgPack.timestamp,
					text: text,
					sender: $scope.name
				});
				textbox.msgText.value= "";
				$location.hash("bottom");
				$anchorScroll();
			}
		}
	}

	$scope.patnerSelected = function(patnerName){
		if(patnerName != "No users online"){
			$scope.patner = patnerName;
			socket.emit('send previous messages', patnerName);
		}
	}

	$scope.isNameAssigned = function(){
		if($scope.name.length != 0)
			return true;
		else 
			return false;
	}

	socket.on("load old message", function(docs){
		$scope.msgs.length = 0;
		for (var index in docs){
			var sender = "patner" + docs[index].from;
			msgPack = {
				timestamp: docs[index]['timestamp'],
				text: docs[index]['text'],
				sender: docs[index][sender],
			}
		$scope.msgs.push(msgPack);
		$scope.$digest();
		}
	});

	socket.on('message', function(msgPack){
		$scope.msgs.push(msgPack);
	});

	socket.on('nameResult', function(result) {
		if (result.success){
			$scope.name = result.name;
			if(result.message){
				alert(result.message);
			}
		}else{
			alert(result.message);
		}
	});

	socket.on('onlineUsers', function(onlineUsers){	
		if(onlineUsers.length != 0){
			$scope.onlineUsers = onlineUsers;
			$scope.$digest();
		}else{
			$scope.onlineUsers = ["No users online"];
		}
	});

	var sanitize = function(input){
		input = input.trim().toLowerCase();
		input = escape(input);
		return input;
	}
	var sanitizeText = function(text){
		text = text.trim();
		text = escape(text);
		return text;
	}
}]);