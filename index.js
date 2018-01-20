
var http = require('http').Server();
var io = require("socket.io")(http);

io.on("connection", function(socket){
	console.log("Connected!")
	socket.role="unknown";
	socket.on("auth",function(type){
		if(type == "dashboard"){
			socket.role="dashboard";
		}else if(type == "robot"){
			var validLocalhost = ["localhost","127.0.0.1","::1"]
			if(validLocalhost.indexOf(socket.handshake.address) > -1){
				socket.emit("auth","success");
				socket.role = "robot";
				console.log("Robot authenticated.")
			}else{
				socket.emit("auth","fail","Robot can only be authenticated from localhost to the server.")
				console.warn("Robot authentication attempt from " + socket.handshake.address + " failed!")
			}
		}else{
			socket.emit("auth","fail","Invalid authentication role.")
			console.warn("Authentication attempt failure from " + socket.handshake.address + " for INVALID role \"" + type + "\" failed!")
		}
	})
	socket.on("data", function(){
		
	})
	socket.on("disconnect", function(){
		console.log("Disconnected!")
	})
})

http.listen(5024, function() {
	console.log("Listening on port 5024...")
})