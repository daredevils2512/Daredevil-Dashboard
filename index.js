var http = require('http').Server();
var io = require("socket.io")(http);
var fs = require('fs');
var util = require('util');

var log_file = fs.createWriteStream(__dirname + "/debug" + Date.now() + ".log", {flags:'w'});
var log_stdout = process.stdout;

console.log = function(d){
	log_file.write(util.format("[INFO] " + d) + '\n');
	log_stdout.write(util.format("[INFO] " + d) + '\n');
}

console.warn = function(d){
	log_file.write(util.format("[WARN] " + d) + '\n');
	log_stdout.write(util.format("[WARN] " + d) + '\n');
}

/*Object.defineProperty(Object.prototype, 'copy', {
  value: function(){
	return JSON.parse(JSON.stringify(this));
	},
  enumerable: false
});*/
/*Object.prototype.copy = function(){
	return JSON.parse(JSON.stringify(this));
}*/

/**
	DATA TEMPLATES
**/
var srx = function() {
	return { // check talon lib
		"id":0,
		"alive":false,
		"controlMode":"Disabled",
		"value":0.0,
		"safetyEnabled":false,
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
		"aChannel":0,
		"bChannel":0,
		"count":0,
		"rawValue":0,
		"period":0,
		"encodingScale":0, //multiplier int
		"distancePerPulse":0,
		"direction":false,
		"distance":0,
		"rate":0,
		"samplesToAverage":0
	}
}
var doubleSolenoid = function() {
	return { //frc::doublesolenoid
		"forwardChannel":0,
		"reverseChannel":0,
		"value":"off"
	}
}

var limitSwitch = function() {
	return {
		"channel":0,
		"activated":false,
	}
}

var matchLength = ((2/*minues*/*60)+30/*seconds*/)*1000; //conv to millis
var genericData = function(){
	/*************\
	 Update Yearly
	\*************/
	return {
		"dashboard":{ // daredevil dashboard data
			"robotConnected":false,
			"robotHasConnected":false,
			"alerts": { /* Change alert system to dynamically generate alerts at the top of the page. */
				"robotlostconnection":{
					active:false,
					type:"warning"
				},
				"robotdisconnected":{
					active:true,
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
				"rearLeft":srx(),
				"rearRight":srx()
			},
			"shifter":doubleSolenoid(),
			"encoders":{
				"left":encoder(),
				"right":encoder(),
			}
		},
		"cube": {
			"intake":{
				"leftMotor": srx(),
				"rightMotor": srx(),
				"grabberSolenoid": doubleSolenoid(),
				"cubeSwitch": limitSwitch()
			},
			"elevatorMotor":srx(),
			"elevatorBottomSwitch":limitSwitch()
		},
		"climber":{
			"leftWingMotor":srx(),
			"rightWingMotor":srx()
		}
	}
}

/**
	DATA
**/
var savedData = {
	// objects will consist of data
	//key = startTime, val = array of datas
}
var replayDir = __dirname + "/replays";
if(!fs.existsSync(replayDir)){
	fs.mkdirSync(replayDir);
}
var replayFiles = fs.readdirSync(replayDir);
for(var i = 0; i < replayFiles.length; i++){
	var stripped = replayFiles[i].substring(0,replayFiles[i].length-5);
	if(parseFloat(stripped) == NaN) continue;
	savedData[stripped] = JSON.parse(fs.readFileSync(replayDir + "/" + replayFiles[i]));
}
var matchLog = [
];
var dataEventLog = [
];
var data = genericData();

function loadSavedData(filepath){
	try{
		return JSON.parse(fs.readFileAync(filepath,"utf8"));
	}catch(e){
		console.warn(e);
		return {errorReading:true}
	}
}

function saveData(data,filepath){
	fs.writeFile(filepath,data,function(err){
		console.warn("failed to save data to \"" + filepath + "\"")
		console.warn(err);

	})
}

function sendRobotError(err){
	for(var i in io.sockets.sockets){
		var socket = io.sockets.sockets[i];
		if(socket.role == "robot"){
			socket.emit("err",err);
		}
	}
}
function sendDashboardError(err){
	for(var i in io.sockets.sockets){
		var socket = io.sockets.sockets[i];
		if(socket.role == "dashboard"){
			socket.emit("err",err);
		}
	}
}

function dataHandler(path,newValue){
	if(path.replace(/\./g,"").length == 0){
		socket.emit("err","Not allowed to set root data. >:(");
		return;
	}
	if(path == "driverstation.enabled"){
		if(data.driverstation.fmsAttached && (data.driverstation.mode == "auto" || data.driverstation.mode == "practice")){
			if(data.match.startTime == -1){
				dataHandler("match.startTime",1);
				
				startLogger();
			}
		}
	}
	if(path == "match.startTime"){
		console.log("initalized start time")
		if(newValue == 1){
			newValue = Date.now();
		}
	}
	if(path == "driverstation.batteryVoltage"){
		if(newValue <= 5.5){
			dataHandler("dashboard.alerts.blackoutwarning.active",true)
			dataHandler("dashboard.alerts.brownout.active",false)
			dataHandler("dashboard.alerts.brownoutwarning.active",false)
		}else if(newValue <= 7.5){
			dataHandler("dashboard.alerts.blackoutwarning.active",false)
			dataHandler("dashboard.alerts.brownout.active",true)
			dataHandler("dashboard.alerts.brownoutwarning.active",false)
		}else if(newValue <= 9.5){
			dataHandler("dashboard.alerts.blackoutwarning.active",false)
			dataHandler("dashboard.alerts.brownout.active",false)
			dataHandler("dashboard.alerts.brownoutwarning.active",true)
		}else{	 
			dataHandler("dashboard.alerts.blackoutwarning.active",false)
			dataHandler("dashboard.alerts.brownout.active",false)
			dataHandler("dashboard.alerts.brownoutwarning.active",false)
		}

	}
	var current = data;
	var steps = path.split(".");
	while(steps.length > 1){
		if(current.hasOwnProperty(steps[0])){
			current = current[steps[0]];
			steps.splice(0,1);
		}else{
			sendRobotError("Invalid path! \"" + path + "\"")
			console.warn("Invalid path! \"" + path + "\"");
			return;
		}
	}
	if(typeof current[steps[0]] != typeof newValue){
		sendRobotError("Cannot set a path to data that does not match its original type.")
		return;
	}
	current[steps[0]] = newValue;
	if(initialDataPoint){
		dataEventLog.push([path,newValue]);
	}
	io.emit("data",path,newValue);
}
var logEntryDelay = 25; // every x milis, log.
var logInterval = -1;
var manualRecording = false;
var initialDataPoint = undefined;
function startLogger(manual){
	initialDataPoint = JSON.parse(JSON.stringify(data));
	initialDataPoint.recordingStart = Date.now();
	console.log("Recording started here: '" + initialDataPoint.recordingStart + "'");
	if(initialDataPoint.match.startTime != -1){
		initialDataPoint.recordingTimeOffset = Date.now() - initialDataPoint.match.startTime;
	}
	matchLog.push(dataEventLog);
	dataEventLog = [];
	if(manual) manualRecording = true;
	logInterval = setInterval(function(){
		matchLog.push(dataEventLog);
		dataEventLog = [];
		if( ( (Date.now() - data.match.startTime > matchLength 
			&& !data.driverstation.enabled ) || 
				data.driverstation.estopped ) && data.driverstation.fmsAttached && !manualRecording ){ // if match over OR estopped
			stopLogger();
			dataHandler("match.startTime",-1);// stop recording.
		}
	},logEntryDelay);
}
function stopLogger(doNotSave){
	clearInterval(logInterval);
	logInterval = -1;
	manualRecording = false;
	/*if(doNotSave && data.driverstation.estopped){
		dataHandler("match.startTime",-1);
	}*/
	
	if(doNotSave){ 
		initialDataPoint = undefined;
		matchLog=[];
		return;
	}
	//save and reset logs
	savedData[initialDataPoint.recordingStart] = {initial:initialDataPoint,log:matchLog};
	console.log("Saved match data to \"" + initialDataPoint.recordingStart + "\"")
	saveLog(initialDataPoint.recordingStart);
	io.emit("logList",getLogList());
	//dataHandler("match.startTime",-1);
	initialDataPoint = undefined;
	matchLog=[];
	
}

function saveLog(id){
	fs.writeFile(replayDir + "/" + id + ".json",JSON.stringify(savedData[id],null,"    ",null),function(err){
		if(err){
			console.log("FILE SAVE ERR: " + err);
		}else{
			console.log("Saved: " + id + ".json")
		}
	})
}

function getLogList(){
	var list = {};
	for(var i in savedData){
		var log = savedData[i];
		list[i] = log.initial.match;
	}
	return list;
}

var autoFile = {
	startPosition: "unknown",
	doSwitch: "false",
	doScale: "false"
}

function readAutoFile(){
	fs.readFile("/home/lvuser/Autonomous.txt", "utf8", function(err, data){
		if(err){
			console.warn("auto file read failure...");
		}else{
			var lines = data.split("\n");
			for(var i = 0; i < lines.length; i++){
				var line = lines[i].replace(/ /g,"");
				var details = line.split(":");
				switch(details[0]){ // id
					case "startPosition":
					autoFile.startPosition = details[1];
					break;
					case "doSwitch":
					autoFile.doSwitch = details[1];
					break;
					case "doScale":
					autoFile.doScale = details[1];
				}
			}
			io.emit("autoData",autoFile);
			//console.log("auto file successful read.")
		}
	});
}



function saveAutoFile() {
	var msg = "startPosition: " + autoFile.startPosition + "\ndoSwitch: " + autoFile.doSwitch + "\ndoScale: " + autoFile.doScale + "\n";
	fs.writeFile("/home/lvuser/Autonomous.txt",msg,function(err){
		if(err){
			console.warn("Failed to save to auto file!");
		}else{
			console.log("Saved new auto data.");
		}
	})
}

io.on("connection", function(socket){
	console.log("Connected!")
	socket.role="unknown";
	socket.on("auth",function(type){
		if(type == "dashboard"){
			socket.role="dashboard";
			socket.emit("auth","success");
			socket.emit("autoData",autoFile);
		}else if(type == "robot"){
			var validLocalhost = ["localhost","127.0.0.1","::1","::ffff:127.0.0.1"]
			if(validLocalhost.indexOf(socket.handshake.address) > -1){
				socket.emit("auth","success");
				socket.role = "robot";
				dataHandler("dashboard.robotConnected",true);
				dataHandler("dashboard.alerts.robotdisconnected.active",false);
				dataHandler("dashboard.alerts.robotlostconnection.active",false);
				dataHandler("dashboard.robotHasConnected",true);
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
	socket.on("autoData", function(data){
		if(socket.role == "dashboard"){
			autoFile = data;
			saveAutoFile();
			io.emit("autoData",autoFile);
		}
	})
	socket.on("refreshAutoData",function(){
		if(socket.role == "dashboard"){
			readAutoFile();
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
						dataHandler("dashboard.alerts.fmsestop.active",true);
					}
				break;
				case "estopclear":
					dataHandler("driverstation.estopped",false);
					dataHandler("dashboard.alerts.fmsestop.active",false);
				break;
				case "fmsconnect":
					dataHandler("driverstation.fmsAttached",true);
					if(data.dashboard.alerts.fmsfault){
						dataHandler("dashboard.alerts.fmsfault.active",false);
					}
				break;
				case "fmsdisconnect":
					dataHandler("driverstation.fmsAttached",false);
					if(data.driverstation.enabled){
						dataHandler("dashboard.alerts.fmsfault.active",true);
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
					startLogger(true);
				break;
				case "stoprecording":
					if(manualRecording){
						stopLogger();
					}else{
						socket.emit("err","Cannot stop recording without a manual start.")
						console.warn("DS at " + socket.handshake.address + " attempted to stop recording without manually starting a recording");
					}
				break;
				case "abortrecording":
					if(manualRecording){
						stopLogger(true);
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
					dataHandler("dashboard.alerts." + alertName + ".active", status);
					/*data.dashboard.alerts[alertName].active = status;
					io.emit("data","dashboard.alerts." + alertName + ".active",status);*/
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
	socket.on("logList", function() {
		if(socket.role == "dashboard"){
			socket.emit("logList",getLogList());
		}else{
			socket.emit("err","Robots cannot fetch the log list.")
			console.warn("Robot attempted to fetch log list for some reason.")
		}
	})
	socket.on("log", function(startTime){
		if(socket.role == "dashboard"){
			if(savedData.hasOwnProperty(startTime)){
				socket.emit("log",savedData[startTime]);
			}else{
				socket.emit("err","Invalid log starttime")
				console.warn("Invalid log starttime fetch attempt")
			}
		}else{
			socket.emit("err","Robots cannot fetch the log list.")
			console.warn("Robot attempted to fetch log list for some reason.")
		}
	})
	socket.on("deleteLog",function(logId){
		if(socket.role == "dashboard"){
			if(savedData.hasOwnProperty(logId)){
				delete savedData[logId];
				fs.unlink(replayDir + "/" + logId + ".json", function(err){
					if(err){
						console.log("Err removing " + logId + ".json: " + err);
					}else{
						console.log("Deleted " + logId  + ".json")
					}
				})
				socket.emit("success","deleted log " + logId);
				socket.emit("logList",getLogList());
			}else{
				socket.emit("err","Invalid log starttime")
				console.warn("Invalid log starttime fetch attempt")
			}
		}else{
			socket.emit("err","Robots cannot fetch the log list.")
			console.warn("Robot attempted to fetch log list for some reason.")
		}
	})
	socket.on("disconnect", function(){
		if(socket.role == "robot"){
			dataHandler("dashboard.robotConnected",false);
			dataHandler("dashboard.alerts.robotdisconnected.active",false);
			dataHandler("dashboard.alerts.robotlostconnection.active",true);
		}
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

http.listen(5801, function() {
	readAutoFile();
	console.log("Listening on port 5801...")
})

var robotConnected = false;

var robotHasConnected = false;

var net = require("net");

net.createServer( function(sock) {
	readAutoFile();
	console.log("Connection: " + sock.remoteAddress  + ":" + sock.remotePort);
	robotConnected = true;
	robotHasConnected = true;
	dataHandler("dashboard.robotConnected",robotConnected);
	dataHandler("dashboard.alerts.robotdisconnected.active",false);
	dataHandler("dashboard.alerts.robotlostconnection.active",false);
	dataHandler("dashboard.robotHasConnected",robotHasConnected);
	sock.on('data', function(data){
		var packets = data.toString().split(":2512:");
		packets.splice(packets.length-1,packets.length);
		for(var i = 0; i < packets.length; i++){
			var packet = packets[i];
			if(packet == "ping"){
				//whatever
			}else{
				try{				
					var dataArray = JSON.parse(packet);
				}catch(e){
					console.log("Invalid Packet! " + packet);
					return;
				}
				//console.log(dataArray[0])
				dataHandler(dataArray[0],dataArray[1]);
			}
		}
	})

	sock.on('close', function(data){
		readAutoFile();
		console.log("CLOSED: " + sock.remoteAddress + ":" + sock.remotePort);
		robotConnected = false;
		dataHandler("dashboard.robotConnected",robotConnected);
		dataHandler("dashboard.alerts.robotdisconnected.active",false);
		dataHandler("dashboard.alerts.robotlostconnection.active",true);
	})
}).listen(5055,"127.0.0.1")
console.log("Listening on *:5055");