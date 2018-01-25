$(function () {
  $('[data-toggle="tooltip"]').tooltip({
    trigger:"hover"
  })
})
var data = {};
var ready = false;
/**********************\
  Start Connection Code
\**********************/
var host = "localhost" // robot debug should really be ran locally.

var socket = io("http://" + host + ":5024"); 

socket.on("connect",function(){
    console.log("Connected. Sending Authentication request.")
    socket.emit("auth","robot")
})

socket.on("auth",function(result, message){
    if(result == "fail"){
        console.error("Authentication Error: " + message)
    }else{
        console.log("Authentication Successful.")
    }
})

socket.on("data", function(path, value){
	if(path.length == 0){
		data = value;
		ready = true;
		socket.emit("data","driverstation.dsAttached",true)


	}else{
        var current = data;
        var steps = path.split(".");
        while(steps.length > 1){
            if(current.hasOwnProperty(steps[0])){
                current = current[steps[0]];
                steps.splice(0,1);
            }else{
                console.error("Invalid path! \"" + path + "\"");
                return;
            }
        }
        current[steps[0]] = value;
  }
  $("#voltage").val(data.driverstation.batteryVoltage);
})

socket.on("err", function(errorText) {
    console.error("Error from server: " + errorText);
})

socket.on("disconnect", function() {
    ready = false;
    console.warn("Lost Connection to Robot.")
});

/****************\
 jQuery Listeners
\****************/
$("#enable").click(function(){
  socket.emit("event","enable");
});
$("#disable").click(function(){
  socket.emit("event","disable");
});
$("#estop").click(function(){
  socket.emit("event","estop");
});
$("#estopClear").click(function(){
  socket.emit("event","estopClear");
});

$("#fms-connect").click(function(){
    socket.emit("event","fmsconnect")
})
$("#fms-disconnect").click(function(){
    socket.emit("event","fmsdisconnect")
})

$("#voltage").change(function() {
	var voltage = $(this).val();
	socket.emit("data","driverstation.batteryVoltage",voltage);
	if(voltage <= 9.5){
		//TODO: add multi stage
		/*
		brownout warning (9.5v)
		browning out (7.5v)
		blackout warning (5.5)
		blackout (robot disconnect)
		*/
	}else if(voltage <= 6.8){
		socket.emit("data","driverstation.isBrowningOut",true)
	}else{
		socket.emit("data","driverstation.isBrowningOut",false)
	}
})


function updater(){
	if(ready){
		
	}
}
setInterval(function(){updater()},10)