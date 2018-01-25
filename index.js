var http = require('http').Server();
var io = require("socket.io")(http);
var fs = require('fs');

Object.prototype.copy = function(){
	return JSON.parse(JSON.stringify(this));
}

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
var matchLength = ((2/*minues*/*60)+30/*seconds*/)*1000; //conv to millis
var genericData = function(){
	/*************\
	 Update Yearly
	\*************/
	return {
		"dashboard":{ // daredevil dashboard data
			"alerts": { /* Change alert system to dynamically generate alerts at the top of the page. */
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
			"mode":"teleop",
			"dsAttached":false,
			"fmsAttached":false,
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

/**
	DATA
**/
var savedData = {
	// objects will consist of data
	//key = startTime, val = array of datas
}
var matchLog = [
];
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
function dataHandler(path,newValue){
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
			console.error("Invalid path! \"" + path + "\"");
			return;
		}
	}
	current[steps[0]] = newValue;
	io.emit("data",path,newValue);
}
var logEntryDelay = 25; // every x milis, log.
var logInterval = -1;
var manualRecording = false;
function startLogger(manual){
	matchLog.push(data.copy());
	if(manual) manualRecording = true;
	logInterval = setInterval(function(){
		matchLog.push(data.copy())
		if( ( (Date.now() - data.match.startTime > matchLength 
			&& !data.driverstation.enabled ) || 
				data.driverstation.estopped ) && data.driverstation.fmsAttached && !manualRecording ){ // if match over OR estopped
			stopLogger();
		}
	},logEntryDelay);
}
function stopLogger(doNotSave){
	clearInterval(logInterval);
	logInterval = -1;
	manualRecording = false;
	if(doNotSave && data.driverstation.estopped){
		dataHandler("match.startTime",-1);
	}
	if(doNotSave) return;
	//save and reset logs
	savedData[matchLog[0].match.startTime] = matchLog.copy();
	console.log("Saved match data to \"" + matchLog[0].match.startTime + "\"")
	dataHandler("match.startTime",-1);
	matchLog=[];
}
io.on("connection", function(socket){
	console.log("Connected!")
	socket.role="unknown";
	socket.on("auth",function(type){
		if(type == "dashboard"){
			socket.role="dashboard";
			socket.emit("auth","success");
		}else if(type == "robot"){
			var validLocalhost = ["localhost","127.0.0.1","::1","::ffff:127.0.0.1"]
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
			dataHandler(path,newValue);
		}else{
			socket.emit("err","Only the Robot can push data to the server.")
			console.warn("Illegal Data Edit from " + socket.handshake.address + "!")
		}
	})
	socket.on("event", function(event){
		if(socket.role == "robot"){
			switch(event.toLowerCase()){
				case "enable":
					if(data.driverstation.estopped){
						socket.emit("err","Cannot enable while estopped");
						return;
					}
					dataHandler("driverstation.enabled",true);
					if(data.driverstation.fmsAttached){
						if(data.match.startTime == -1){
							dataHandler("match.startTime",Date.now());
							
							startLogger();
						}
					}else{
						dataHandler("match.startTime",Date.now());
					}

				break;
				case "disable":
					dataHandler("driverstation.enabled",false);
					if(!data.driverstation.fmsAttached){
						dataHandler("match.startTime",-1);
					}
				break;
				case "estop":
					dataHandler("driverstation.enabled",false);
					dataHandler("driverstation.estopped",true);
					if(!data.driverstation.fmsAttached){
						dataHandler("match.startTime",-1);
					}else{
						dataHandler("dashboard.alerts.fmsestop",true);
					}
				break;
				case "estopclear":
					dataHandler("driverstation.estopped",false);
				break;
				case "fmsconnect":
					dataHandler("driverstation.fmsAttached",true);
					if(data.dashboard.alerts.fmsfault){
						dataHandler("dashboard.alerts.fmsfault",false);
					}
				break;
				case "fmsdisconnect":
					dataHandler("driverstation.fmsAttached",false);
					if(data.driverstation.enabled){
						dataHandler("dashboard.alerts.fmsfault",true);
					}
				break;
				default:
					socket.emit("err","Invalid Robot Event: \"" + event + "\"")
					console.warn("Invalid Robot Event: \"" + event + "\"")
				break;
			}
		}else{
			switch(event.toLowerCase()){
				case "startrecording":
					startRecording(true);
				break;
				case "stoprecording":
					if(manualRecording){
						stopRecording();
					}else{
						socket.emit("err","Cannot stop recording without a manual start.")
						console.warn("DS at " + socket.handshake.address + " attempted to stop recording without manually starting a recording");
					}
				break;
				case "abortrecording":
					if(manualRecording){
						stopRecording(true);
					}else{
						socket.emit("err","Cannot abort recording without a manual start.")
						console.warn("DS at " + socket.handshake.address + " attempted to abort recording without manually starting a recording");
					}
				break;
				case "clearalerts":
					if(logInterval == -1){
						data.alerts = {
							errors:{},
							warnings:{}
						}
						io.emit("data","",data);
					}
				break;
				default:
					socket.emit("err","Invalid Dashboard Event: \"" + event + "\"")
					console.warn("Invalid Dashboard Event: \"" + event + "\"")
				break;
			}
		}
	})
	socket.on("alert", function(alertName,status){
		if(socket.role == "robot"){
			if(data.dashboard.alerts.hasOwnProperty(alertName)){
				if(data.dashboard.alerts[alertName].active != status){
					data.dashboard.alerts[alertName].active = status;
					io.emit("data","dashboard.alerts." + alertName + ".active",status);
				}
			}else{
				socket.emit("err","Invalid alert: " + alertName);
			}
		}else{
			socket.emit("err","Only the Robot can set alert status.")
			console.warn("Illegal Alert from " + socket.handshake.address + "!")
		}
	})
	socket.on("matchData", function(eventName,matchType,matchNumber,matchReplay,matchAlliance,matchDSLocation){
		if(socket.role == "robot"){
			dataHandler("match.eventName",eventName);
			dataHandler("match.type",matchType);
			dataHandler("match.number",matchNumber);
			dataHandler("match.replay",matchReplay);
			dataHandler("match.alliance",matchAlliance);
			dataHandler("match.dslocation",matchDSLocation);
		}else{
			socket.emit("err","Only the Robot can push data to the server.")
			console.warn("Illegal Match Data Edit from " + socket.handshake.address + "!")
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