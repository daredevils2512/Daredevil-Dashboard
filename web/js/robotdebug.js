$(function () {
  $('[data-toggle="tooltip"]').tooltip({
    trigger:"hover"
  })
})
$("#voltage").val(12)
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
        socket.emit("data","driverstation.mode","teleop");
        socket.emit("data","match.alliance",$("#alliance").val())
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
  //$("#voltage").val(data.driverstation.batteryVoltage);
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
  //socket.emit("event","enable");
  socket.emit("data","driverstation.enabled",true)
});
$("#disable").click(function(){
  socket.emit("data","driverstation.enabled",false)
});
$("#estop").click(function(){
  socket.emit("data","driverstation.enabled",false)
  socket.emit("data","driverstation.estopped",true)
});
$("#estopClear").click(function(){
  socket.emit("data","driverstation.enabled",false)
  socket.emit("data","driverstation.estopped",false)
});

$("#fms-connect").click(function(){
    socket.emit("data","driverstation.fmsAttached",true)
})
$("#fms-disconnect").click(function(){
    socket.emit("data","driverstation.fmsAttached",false)
})

$("#eventName").change(function(){
  socket.emit("data","match.eventName",$(this).val())
})

$("#matchNum").change(function(){
  socket.emit("data","match.number",parseFloat($(this).val()))
})

$("#replayNum").change(function() {
  socket.emit("data","match.replay",parseFloat($(this).val()))
})

$("#matchType").change(function() {
  socket.emit("data","match.type",$(this).val())
})

$("#gameMessage").on("input",function() {
    socket.emit("data","match.gameMessage",$("#gameMessage").val())
})


$("#alliance").change(function(){
  socket.emit("data","match.alliance",$(this).val())
})

function updater(){
	if(ready){
		socket.emit("data","driverstation.batteryVoltage",parseFloat((parseFloat($("#voltage").val()) + (Math.random()*0.8)).toFixed(4)))
	}
}
setInterval(function(){updater()},80)