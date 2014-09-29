var http = require("http");
var fs = require("fs");
var path = require("path");
var mime = require("mime");
var cache = {};

function error404 (response) {
	response.writeHead(404, {'content-type': 'text/plain'});
	response.write("Error: 404, file not found");
	response.end();
}

function sendFile(response, filePath, fileContents){
	response.writeHead(200, {'content-type': mime.lookup(path.extname(filePath))});
	response.end(fileContents);
}

function serveStatic(response, cache, absPath){
	if(cache[absPath]){
		sendFile(response, absPath, cache[absPath]);
	}else{
		fs.exists(absPath,function(exists){
			if (exists) {
				fs.readFile(absPath, function(err, data){
					if(err){
						error404(response);
					}else{
						cache[absPath] = data;
						sendFile(response, absPath, data);
					}
				});
			}else{
				error404(response);
			}
		});
	}
}

var server = http.createServer(function(request, response){
	var filePath = '';
	if (request.url == '/') {
		filePath = 'public/index.html';
	}else{
		filePath = 'public' + request.url;
	}
	var absPath = './' + filePath;
	serveStatic(response, cache, absPath);
});

server.listen(3000,function(){
	console.log("server starting at port: 3000");
});

var chatServer = require("./lib/chat_server.js");
chatServer.listen(server);