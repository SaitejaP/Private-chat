var http = require("http");
var fs = require("fs");
var path = require("path");
var mime = require("mime");
var cache = {};

var app = require("./lib/app.js");
var chatServer = require("./lib/chat_server.js");
var server = http.Server(app);

app.get('/', function(req, res){
  res.sendFile('index.html');
});

server.listen(3000, function(){
  console.log('listening on port:3000');
});

chatServer.listen(server);