var http = require("http");
var app = require("./lib/app.js");
var chatServer = require("./lib/chat_server.js");

app.get('/', function(req, res){
  res.sendFile('index.html');
});

var server = http.Server(app);
chatServer.listen(server);

server.listen(3000, function(){
  console.log('listening on port:3000');
});

