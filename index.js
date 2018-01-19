
var http = require('http').Server();
var io = require("socket.io")(http);

io.on("connection", function(socket){
	console.log("Client has connected to the server.")
})

http.listen(5024, function() {
	console.log("Listening on port 5024...")
})