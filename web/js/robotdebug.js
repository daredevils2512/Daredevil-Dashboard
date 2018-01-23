$(function () {
  $('[data-toggle="tooltip"]').tooltip({
    trigger:"hover"
  })
})

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

socket.on("err", function(errorText) {
    console.error("Error from server: " + errorText);
})

socket.on("disconnect", function() {
    ready = false;
    console.warn("Lost Connection to Robot.")
});
