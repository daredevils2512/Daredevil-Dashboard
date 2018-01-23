var http = require('http').Server();
var io = require("socket.io")(http);
var fs = require('fs');

/**
	DATA TEMPLATES
**/
var srx = function() {
	return { // check talon lib
		"id":0,
		"alive":true,
		"controlMode":"Disabled",
		"value":0.0,
		"safetyEnabled":true,
		"outputCurrent":0, //amps
		"temperature":0,
		"firmwareVersion":"3.x",
		"faults":{
			"underVoltage":false,
		 	"forwardLimitSwitch":false,
		 	"reverseLimitSwitch":false,
		 	"forwardSoftLimit":false,
		 	"reverseSoftLimit":false,
		 	"hardwareFailure":false,
		 	"resetDuringEn":false,
		 	"sensorOverflow":false,
		 	"sensorOutOfPhase":false,
		 	"hardwareESDReset":false,
		 	"remoteLossOfSignal":false
		}
	}
};

var encoder = function() {
	return { // frc::Encoder
		"aChannel":1,
		"bChannel":2,
		"count":0,
		"rawValue":0,
		"period":0,
		"encodingScale":1, //multiplier int
		"distancePerPulse":0,
		"direction":false,
		"distance":0,
		"rate":0,
		"samplesToAverage":0
	}
}
var doubleSolenoid = function() {
	return { //frc::doublesolenoid
		"forwardChannel":1,
		"reverseChannel":2,
		"value":"off"
	}
}
var genericData = function(){
	/*************\
	 Update Yearly
	\*************/
	return {
		"driverstation":{ //check frc::DriverStation wpilibc++
			"enabled":false, // put example of type (boolean = true, number = 1, etc)
			"estopped":false,
			"mode":"teleop",
			"dsAttached":false,
			"fmsAttached":false,
			"isBrowningOut":false,
			"batteryVoltage":12.5
		},
		"match": { //check frc::DriverStation wpilibc++
			"eventName":"Daredevils",
			"gameMessage":"RRR",
			"type":"none",
			"number":1,
			"replay":0,
			"alliance":"red",
			"dslocation":1,
			"startTime":0, // in millis
		},
		"drivetrain": {
			"motorControllers": {
				"frontLeft":srx(),
				"frontRight":srx(),
				"backLeft":srx(),
				"backRight":srx()
			},
			"shifter":doubleSolenoid(),
			"encoders":{
				"frontLeft":encoder(),
				"frontRight":encoder(),
				"backLeft":encoder(),
				"backRight":encoder()
			}
		},
		alerts:{
			errors:[],
			warnings:[]
		}
	}
}

/**
	DATA
**/
var savedData = {
	// objects will consist of data
}
var data = genericData();

function loadSavedData(filepath){
	try{
		return JSON.parse(fs.readFileAync(filepath,"utf8"));
	}catch(e){
		console.error(e);
		return {errorReading:true}
	}
}

function saveData(data,filepath){
	fs.writeFile(filepath,data,function(err){
		console.error("failed to save data to \"" + filepath + "\"")
		console.error(err);

	})
}

function dataHandler(socket,path,value){
	if(path.replace(/\./g,"").length == 0){
		socket.emit("err","Not allowed to set root data. >:(");
		return;
	}
	var current = data;
	var steps = path.split(".");
	while(steps.length > 1){
		if(current.hasOwnProperty(steps[0])){
			current = current[steps[0]];
			steps.splice(0,1);
		}else{
			socket.emit("err",path + " is an invalid data path.");
			console.error("Invalid path! \"" + path + "\"");
			return;
		}
	}
	current[steps[0]] = newValue;
	socket.broadcast.emit("data",path,newValue);
}
io.on("connection", function(socket){
	console.log("Connected!")
	socket.role="unknown";
	socket.on("auth",function(type){
		if(type == "dashboard"){
			socket.role="dashboard";
			socket.emit("auth","success");
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
			return;
		}
		socket.emit("data","",data);
	})
	socket.on("data", function(path,newValue){
		if(socket.role == "robot"){
			dataHandler(socket,path,newValue);
		}else{
			socket.emit("err","Only the Robot can push data to the server.")
			console.warn("Illegal Data Edit from " + socket.handshake.address + "!")
		}
	})
	socket.on("event", function(event){
		if(socket.role == "robot"){
			switch(event.toLowerCase()){
				case "dsenable"
			}
		}else{
			socket.emit("err","Only the Robot can fire events.")
			console.warn("Illegal Event Fire from " + socket.handshake.address + "!")
		}
	})
	socket.on("disconnect", function(){
		console.log("Disconnected!")
	})
	socket.on("debug", function(command){
		if(command == "enable"){
			data.driverstation.enabled = true;
			data.match.startTime = Date.now();
			io.emit("data","",data); 
		}
	})
})

http.listen(5024, function() {
	console.log("Listening on port 5024...")
})