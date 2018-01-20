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
			"mode":"teleop"
			"dsAttached":false,
			"fmsAttached":false,
			"isBrowningOut":false,
			"batteryVoltage":12.5
		},
		"match": { //check frc::DriverStation wpilibc++
			"eventName":"Gitch",
			"gameMessage":"LRL",
			"type":"qualifications",
			"number":1,
			"replay":0,
			"alliance":"red",
			"dslocation":1,
			"currentTime":0,
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

var categoryToDisplayType = {
	""
}
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