var http = require('http').Server();
var io = require("socket.io")(http);
var fs = require('fs');


var srx = function() {
	return { // check talon lib
		"id":0,
		"alive":true,
		"controlMode":"Disabled",
		"value":0.0,
		"safetyEnabled":true,
		"outputCurrent":0, //amps
		"temperature":0,
		"firmwareVersion":0, // versions are numbers i guess
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
var matchLength = ((2/*minues*/*60)+30/*seconds*/)*1000; //conv to millis
var genericData = function(){
	/*************\
	 Update Yearly
	\*************/
	return {
		"dashboard":{ // daredevil dashboard data
			"robotConnected":true,
			"robotHasConnected":true,
			"alerts": { /* Change alert system to dynamically generate alerts at the top of the page. */
				"robotlostconnection":{
					active:false,
					type:"warning"
				},
				"robotdisconnected":{
					active:false,
					type:"primary"
				},
				"fmsestop":{
		        	active:false,
		        	type:"danger"
		        },
		        "dsoffline":{
		        	active:false,
		        	type:"danger"
		        },
		        "subsysfail":{
		        	active:false,
		        	type:"danger"
		        },
		        "cmdfail":{
		        	active:false,
		        	type:"danger"
		        },
		        "autofail":{
		        	active:false,
		        	type:"danger"
		        },
		        "autocollide":{
		        	active:false,
		        	type:"danger"
		        },
		        "fmsfault":{
		        	active:false,
		        	type:"danger"
		        },
		        "brownoutwarning":{
		        	active:false,
		        	type:"secondary"
		        },
		        "brownout":{
		        	active:false,
		        	type:"warning"
		        },
		        "blackoutwarning":{
		        	active:false,
		        	type:"danger"
		        },
		        "blackout": {
		        	active:false,
		        	type:"danger"
		        },
		        "conndropped":{
		        	active:false,
		        	type:"danger"
		        }
		    },
		},
		"driverstation":{ //check frc::DriverStation wpilibc++
			"enabled":false, // put example of type (boolean = true, number = 1, etc)
			"estopped":false,
			"mode":"none",
			"dsAttached":false,
			"fmsAttached":false,
			"batteryVoltage":0.0
		},
		"match": { //check frc::DriverStation wpilibc++
			"eventName":"",
			"gameMessage":"",
			"type":"none",
			"number":1,
			"replay":0,
			"alliance":"none",
			"dslocation":1,
			"startTime":-1, // in millis
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
	}
}

var data = genericData();

var savedData = {

}

var replayDir = __dirname + "/replays";
var replayFiles = fs.readdirSync(replayDir);
for(var i = 0; i < replayFiles.length; i++){
	var stripped = replayFiles[i].substring(0,replayFiles[i].length-5);
	if(parseFloat(stripped) == NaN) continue;
	savedData[stripped] = JSON.parse(fs.readFileSync(replayDir + "/" + replayFiles[i]));
}

function getLogList(){
	var list = {};
	for(var i in savedData){
		var log = savedData[i];
		list[i] = log.initial.match;
	}
	return list;
}

io.on("connection", function(socket){
	console.log("Connected!")
	socket.role="unknown";
	socket.on("auth",function(type){
		socket.emit("auth","success");
		socket.emit("data","",data);
		socket.emit("logList",getLogList())
	})
	socket.on("logList", function() {
		socket.emit("logList",getLogList());
	})
	socket.on("log", function(startTime){
		if(savedData.hasOwnProperty(startTime)){
			socket.emit("log",savedData[startTime]);
		}else{
			socket.emit("err","Invalid log starttime")
			console.warn("Invalid log starttime fetch attempt")
		}
	})
	socket.on("disconnect", function(){
		console.log("Disconnected!")
	})
})

http.listen(5024, function() {
	console.log("Listening on port 5024...")
})