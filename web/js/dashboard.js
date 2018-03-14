var data = undefined; // fetch from server
var ready = false;
var _recording = false;
function isRecording() {
    return _recording || data.driverstation.enabled;
}
function mtypeToReadable(type, short) {
    switch(type){
        case "practice":
        return (short)?"Prac":"Practice";

        case "elimination":
        return (short)?"Elim":"Elimination";

        case "qualification":
        return (short)?"Qual":"Qualification";

        case "none":
        return (short)?"Dev":"Development";

        default:
        return "????";
    }
}

var genericLineChart = function() {
    return {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                data: [],
                lineTension: 0,
                backgroundColor: 'transparent',
                borderColor: '#007bff',
                borderWidth: 4,
                pointBackgroundColor: '#007bff',
                pointRadius: 0
            }]
        },
        options: {
            animation: {
                duration: 0, // general animation time
            },
            hover: {
                animationDuration: 0, // duration of animations when hovering an item
            },
            responsiveAnimationDuration: 0, // animation duration after a resize
            scales: {
                xAxes: [{
                    type: 'category',
                    ticks: {
                        autoSkip: true,
                        maxTicksLimit: 5,
                        maxRotation: 0,
                        minRotation: 0
                    }
                }],
                yAxes: [{
                    ticks: {
                        beginAtZero: false
                    }
                }]
            },
            legend: {
                display: false,
            }
        }
    };
}

function switchPage(id){
    $(".dashpage").hide();
    var pages = $(".dashpage");
    for(var i = 0; i < pages.length; i++){
        $("#" + pages[i].id + "-tab").removeClass("active");
    }
    $("#" + id).show();
    $("#" + id + "-tab").addClass("active")
}



var charts = [];

function newChart(element, settings) {
    var ctx = element;
    var chart = new Chart(ctx, settings);
    chart.trackedData = [];
    chart.trackedDataOffset = 0;
    chart.timeCap = 5;
    chart.startTime = Date.now();
    charts.push(chart);
    return chart;
}
function addData(chart, time, data) {
    chart.trackedData.push(time);
    chart.data.labels.push(millisTimeStr(time - chart.startTime));
    chart.data.datasets[0].data.push(data);
    if (time - chart.trackedData[chart.trackedDataOffset] > (chart.timeCap) * 1000) {
        chart.data.labels.splice(0, 1);
        chart.data.datasets[0].data.splice(0, 1);
        chart.trackedDataOffset++;
    }
    chart.update(0);
}

function resetCharts() {
    chartOffset = Date.now();
    for (var i = 0; i < charts.length; i++) {
        var chart = charts[i];
        chart.data.labels = [];
        chart.data.datasets[0].data = [];
        chart.trackedDataOffset = chart.trackedData.length - 1;
        chart.startTime = Date.now();
    }

}

var dOSettings = genericLineChart();
dOSettings.options.scales.yAxes[0].ticks.beginAtZero = false;
dOSettings.options.scales.yAxes[0].ticks.suggestedMax = 120;
var dOChart = newChart($("[dash-graph-id=\"drivetrainOutput\"]")[0],dOSettings);
dOChart.timeCap = 15;
dOChart.data.datasets[0].borderWidth = 2;
setInterval(function(){
    if(!ready) return;
    var combinedCurrentDraw = data.drivetrain.motorControllers.frontLeft.outputCurrent + 
        data.drivetrain.motorControllers.frontRight.outputCurrent + 
        data.drivetrain.motorControllers.rearLeft.outputCurrent + 
        data.drivetrain.motorControllers.rearRight.outputCurrent;
    if(combinedCurrentDraw > 50){
        if(combinedCurrentDraw > 90){
            dOChart.data.datasets[0].backgroundColor="rgba(255,0,0,0.25)";
            dOChart.data.datasets[0].borderColor="rgb(255,0,0)"
        }else{
            dOChart.data.datasets[0].backgroundColor="rgba(255,255,0,0.25)";
            dOChart.data.datasets[0].borderColor="rgb(255,255,0)"
        }
    }else{
        dOChart.data.datasets[0].backgroundColor="rgba(0,255,0,0.25)";
        dOChart.data.datasets[0].borderColor="rgb(0,255,0)"
    }
    addData(dOChart,Date.now(),combinedCurrentDraw);
},30)
//newChart("testChart", genericLineChart());
//newChart("testChart2", genericLineChart());

function fixedNum(num) {
    var str = num.toString();
    return (str.length == 1) ? ("0" + str) : str;
}
function millisTimeStr(forceTime){
    var current = Date.now();
    if(oldData){
        current = data.recordingStart + ((data.recordingTimeOffset)?data.recordingTimeOffset:0) + (step * logSpeed);
    }
    var modTime = (current - ((data.match.startTime != -1)?data.match.startTime:((data.recordingStart)?data.recordingStart:0))) + ((data.match.startTime == -1 && data.recordingTimeOffset)?data.recordingTimeOffset:0);
    if(forceTime) modTime = forceTime;
    var millis = modTime % 1000;

        modTime = (modTime - millis) / 1000;

    var seconds = modTime%60;

        modTime = (modTime - seconds) / 60;

    var minutes = modTime % 60;

    var hrs = (modTime - minutes) / 60;
    


    var timeStr = ( (hrs > 0)?(fixedNum(Math.floor(hrs)) +":"):"" ) + fixedNum(Math.floor(minutes)) + ":" + fixedNum(Math.floor(seconds)) + ":" + fixedNum(Math.floor(millis/10).toString()).substring(0, 2)
    return timeStr;
}


var alertContents = {
    "robotdisconnected":"Please wait for Robot Code to respond...",
    "robotlostconnection":"Robot Code Connection Dropped! <div style=\"font-size:20px;display:block\">Robot Code possibly crashed.</div>",
    "fmsestop":"ROBOT FMS ESTOP <div style=\"font-size:20px;display:block\">Robot was Emergency Stopped during a match while connected to the FMS.",
    "dsoffline":"DRIVER STATION OFFLINE",
    "subsysfail":"SUBSYSTEM FAILURE",
    "cmdfail":"COMMAND FAILURE",
    "autofail":"AUTONOMOUS FAILURE",
    "autocollide":"AUTONOMOUS COLLISION",
    "fmsfault":"FMS CONNECTION DROPPED <div style=\"font-size:20px;display:block\">REPORT TO FTA ASAP<br><span style=\"font-size:15px\">DriverStation#IsFMSAttached() reported false after being previously reported true before and after robot was enabled.</span></div>",
    "brownoutwarning":"BROWNOUT IMMINENT",
    "brownout":"BROWNOUT",
    "blackoutwarning":"DANGEROUSLY LOW VOLTAGE <div style=\"font-weight:bold\">BLACKOUT IMMINENT</div>",
    "blackout": "BLACKOUT <div style=\"font-size:20px;display:block\">The robot lost connection due to excessive power draw.</div>",
    "conndropped": "CONNECTION LOST <div style=\"font-size:16px;display:block\">Lost connection to the dashboard server for an unknown reason. <b>If the robot is still running, please report this error to programming ASAP</b></div>"
}
function updateAlerts() {
    for(var i in data.dashboard.alerts){
    	var alert = data.dashboard.alerts[i];
    	if(alert.active == true){
    		if($("#alert-" + i).length == 1) return;
	    	var contents = "ALERT: " + i;
	    	if(alertContents.hasOwnProperty(i)){
	    		contents = alertContents[i];
	    	}
	    	var ele = $("<div>").addClass("alert").addClass("alert-" + alert.type).attr("id","alert-" + i);
	    	ele.append($("<h1>").addClass("text-center").html(contents));
	    	$("#alerts").append(ele);
    	}else{
    		$("#alert-" + i).remove();
    	}
    }
}
var notran = [];
var quotes = [
    ["WHEN YOU HAVE COPD, IT CAN BE HARD TO BREATHE","Grandpa Wolf"],
    ["its water game guise", "Dean Kamen"],
    ["Connor's Mom","Fabrication"],
    ["We should use pixy cameras after 2017","Satan"],
    ["It's programming's fault.", "Electronics & Build Depts."],
    ["Told you so","Programming Dept."],
    ["The pixy broke again, where's the calibration file?","Troy Martin"],
    ["It'll take 15 minutes","Build Dept."],
    ["Lemon Squeezers"],
    ["They probably used 1 wood screw, don't climb on that","Cameron"],
    //["Love, and sexual assault","Woodie Flowers"],
    ["I lost my gracious professional units, help what do","Chief Delphi"],
    ["Catch me if you can!","Kahl"],
    ["Staright","Jared"],
    //["gas the irish","Lucas Finch"],
    ["Rain smells like death","Noah"],
    ["Corn is fruit","Linnea"],
    ["Daddy Philip and the royal nut","Linnea"],
    ["Thick chunky boi","Olivia"],
    ["Better goodness","Doug"],
    //["Don Ness is a daddy person","Olivia"],
    //["I can't tell if I'm feeling homicidal or suicidal","Linnea"],
    ["Ryan's a flight attendant","Sunna"],
    ["Hey Sunna is your sister available","Marcus"],
    ["We're going downtown now","Gary"],
    ["You're laying down I can't see the TV","Noah"],
    ["Your feet are small","Sunna"],
    //["Robot sit on my face","Kahl"],
    ["I swallowed the clip! Wait it came back up.","Cameron"],
    ["My saw is super strong","Cameron"],
    //["I love Perkins. They even have blood on the ceiling.","Olivia"],
    //["I'm always thirsty","Koben"],
    //["God I hate this team","Cameron"]
]
var lastQuoteUpdate = Date.now();
var lastQuote = -1;
function randomizeQuote(){
    if(quotes.length == 0){
        return;
    }
    if(notran.length == 0){
        for(var i = 0; i < quotes.length; i++){
            notran.push(i);
        }
    }
    var qindex = -1;
    var selec;
    while(qindex == -1 || qindex == lastQuote){
        selec = Math.round(Math.random()*(notran.length-1));
        qindex = notran[selec];
    }
    notran.splice(selec,1);
    lastQuote = qindex;
    var quote = quotes[qindex];
    $("#quote-text")[0].innerHTML = ("\""+quote[0]+"\"");
    $("#quote-source")[0].innerHTML = (quote[1])?"- " +(quote[1]):"";
    lastQuoteUpdate = Date.now();
}

function updateIndicators() {
    $("#matchType")[0].innerHTML = (data.match.eventName + " " + mtypeToReadable(data.match.type));
    $("#matchNumber")[0].innerHTML = (data.match.number > 0)?(("#" + data.match.number + ((data.match.replay >= 1)?" (Replay #"+data.match.replay+")":""))):"";

    
    if(data.driverstation.estopped){
        $("#dsd-enabled").addClass("badge-danger").removeClass("badge-success")[0].innerHTML = ("ESTOPPED");
    }else if(data.driverstation.enabled == true){
        $("#dsd-enabled").removeClass("badge-danger").addClass("badge-success")[0].innerHTML = ("Enabled");
    }else{
        $("#dsd-enabled").addClass("badge-danger").removeClass("badge-success")[0].innerHTML = ("Disabled");
        
    }

    var modeStr = "unknown..."

    switch(data.driverstation.mode){
        case "teleop":
            modeStr = "TeleOp";
        break;
        case "auto":
            modeStr = "Autonomous";
        break;
        case "practice":
            modeStr = "Practice";
        break;
        case "test":
            modeStr = "Testing";
        break;
    }

    $("#dsd-mode")[0].innerHTML = (modeStr);

    if(data.driverstation.dsAttached == true){
        $("#dsd-dsAttached").removeClass("badge-secondary").addClass("badge-success");
    }else{
        $("#dsd-dsAttached").addClass("badge-secondary").removeClass("badge-success");
    }

    if(data.driverstation.fmsAttached == true){
        $("#dsd-fmsAttached").removeClass("badge-secondary").addClass("badge-success");
    }else{
        $("#dsd-fmsAttached").addClass("badge-secondary").removeClass("badge-success");
    }

    $("#dsd-batteryVoltage")[0].innerHTML = (data.driverstation.batteryVoltage.toFixed(4))

    if(data.driverstation.isBrowningOut == true){
        $("#dsd-isBrowningOut").removeClass("badge-secondary").addClass("badge-danger");
    }else{
        $("#dsd-isBrowningOut").addClass("badge-secondary").removeClass("badge-danger");
    }
    var dats = $("[dash-data]");
    for(var i = 0; i < dats.length; i++){
        if(typeof dats[i] == "number")continue;
        var pb = $(dats[i]).attr("dash-data").split(".");
        var dat = data[pb[0]]
        for(var z = 1; z < pb.length; z++){
            dat = dat[pb[z]]
        }
        
        $(dats[i]).text(dat.toFixed(3));
    }

    if(data.cube.elevatorBottomSwitch.activated){
        $("#elevatorSwitch").removeClass("badge-danger").addClass("badge-success");
    }else{
        $("#elevatorSwitch").addClass("badge-danger").removeClass("badge-success");
    }

    if(data.cube.intake.cubeSwitch.activated){
        $("#cubeSwitch").removeClass("badge-danger").addClass("badge-success");
    }else{
        $("#cubeSwitch").addClass("badge-danger").removeClass("badge-success");
    }
}
function updateDashboard(){
    if(ready && data.dashboard.robotConnected){
        if(Math.floor(Date.now()/500)%2===0 && isRecording()){
            $("link[rel='icon']").attr("href", "icon-active.png");
        }else{
            $("link[rel='icon']").attr("href", "icon.png");
        }
        

        if(data.driverstation.estopped){
            $("#quote-text")[0].innerHTML = ("\"Catch me if you ca-\"");
            $("#quote-source")[0].innerHTML = "- Kahl";
            $("#quote").show();
            $("#matchHeader").hide();
        }else{
            $("#quote").hide();
            $("#matchHeader").show();
            if(data.match.startTime > -1 || data.recordingStart){
                $("#matchTime")[0].innerHTML = (millisTimeStr())
            }else{
                $("#matchTime")[0].innerHTML = ("00:00:00")
            }
        }
        
    }else{
        $("link[rel='icon']").attr("href", "icon.png");

        $("#quote").show();
        $("#matchHeader").hide();

        if(enableDrop){
        	$("#quote-text")[0].innerHTML = ("\"oh noes\"");
    		$("#quote-source")[0].innerHTML = "You";
        }else{
        	if(Date.now()-lastQuoteUpdate >= 5*1000){
        	    randomizeQuote();
        	}
    	}
        
    }
    if(enableDrop){
        $("#err-blackout").show();
        $("#warn-brownout").hide();
        $("#warnings").hide();

        $("#errors").show();
        if(Math.floor(Date.now() / 300) % 2 == 0){
            $(".container-fluid").css("backgroundColor","rgb(255,150,150)");
        }else{
            $(".container-fluid").css("backgroundColor","");
        }
    }else{
        $("#err-blackout").hide();
        $(".container-fluid").css("backgroundColor","");
    }

    if(activeLog){
        if(Math.floor(Date.now() / 500) % 2 == 0){
            $(".navbar").css("backgroundColor","rgb(0,0,150)");
        }else{
            $(".navbar").css("backgroundColor","");
        }
    }else{
        $(".navbar").css("backgroundColor","");
    }
}

setInterval(function(){updateDashboard();},10);

$(function () {
  $('[data-toggle="tooltip"]').tooltip({
    trigger:"hover"
  })
})

/**********************\
  Start Connection Code
\**********************/
var host = "10.25.12.2"
if(location.hasOwnProperty("search")){
    if(location.search.toLowerCase().substring(1) == "testing"){
        host = "localhost"
    }else if(location.search.toLowerCase().substring(1) == "usb"){
        host = "172.22.11.2"
    }else if(location.search.toLowerCase().substring(1) == "nq"){
        quotes = [];
        host = "localhost";
    }
}
randomizeQuote();
var socket = io("http://" + host + ":5801"); 
var enableDrop = false;
socket.on("connect",function(){
    enableDrop = false;
    console.log("Connected. Sending Authentication request.")
    socket.emit("auth","dashboard")
})

socket.on("auth",function(result, message){
    if(result == "fail"){
        console.error("Authentication Error: " + message)
    }else{
        console.log("Authentication Successful.")
        socket.emit("logList");
    }
})

socket.on("err", function(errorText) {
    console.error("Error from server: " + errorText);
})
var _recentData = false;

function dataHandler(path, value,isSocket){
    var current = (activeLog && isSocket)?origData:data;
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
socket.on("data", function(path, value){

    if(path.length == 0){
        if(!ready){
            ready = true;
        }
        if(activeLog){
            oldData = value;
        }else{
            data = value;
        }
    }else if(ready){
        dataHandler(path,value,true);
    }
    if(!ready) return;
    updateIndicators();
    updateAlerts();
    _recentData = true;
})

socket.on("disconnect", function() {
    ready = false;
    console.warn("Lost Connection to Robot.")
    if(data.driverstation.enabled){
	    if(data.driverstation.batteryVoltage<= 7.5){
        	data.dashboard.alerts.blackoutwarning.active = false;
        	data.dashboard.alerts.brownout.active = false;
        	data.dashboard.alerts.blackoutwarning.active = false;
            data.dashboard.alerts.blackout.active = true;
            updateAlerts();
	    }else{
	    	data.dashboard.alerts.conndropped.active = true;
            updateAlerts();
	    }
	    enableDrop = true;
	}
});
var origData =undefined;
socket.on("log",function(dat){
    if(!window.origData)
        window.origData = JSON.parse(JSON.stringify(data))

    window.logData = dat.log;
    window.initialData = dat.initial;
    window.data = JSON.parse(JSON.stringify(window.initialData));


    var dtOutputDatapointCount = {};
    var dtOutputCuml = {};

    var lowestBatteryVoltage = window.initialData.driverstation.batteryVoltage;

    var highestCurrentDraw = 0;
    var highestCurrentDrawID = "??";

    for(var i = 0; i < logData.length; i++){
        var frame = logData[i];
        for(var z = 0; z < frame.length; z++){
            var edit = frame[z];
            if(edit[0] == "driverstation.batteryVoltage"){
                if(edit[1] < lowestBatteryVoltage){
                    lowestBatteryVoltage = edit[1];
                }
            }else if(edit[0].indexOf("drivetrain.motorControllers") > -1 && edit[0].indexOf("outputCurrent")){
                var mcID = edit[0].split(".")[2];

                if(edit[1] > highestCurrentDraw){
                    highestCurrentDraw = edit[1];
                    highestCurrentDrawID = mcID;
                }
                if(!dtOutputDatapointCount[mcID] || !dtOutputCuml[mcID]){
                    dtOutputDatapointCount[mcID] = 0;
                    dtOutputCuml[mcID] = 0;
                }
                dtOutputDatapointCount[mcID]++;
                dtOutputCuml[mcID] += edit[1];
            }
        }
    }
    var dtAllAverage = 0;
    for(var i in dtOutputDatapointCount){
        dtAllAverage += dtOutputCuml[i] / dtOutputDatapointCount[i];
    }
    $("#replayAvgDrivetrainAmps").text((dtAllAverage).toFixed(4));
    $("#replayHighestCurrentDraw").text(highestCurrentDraw);
    $("#replayHighestCurrentDrawID").text(highestCurrentDrawID);
    $("#lowestBatteryVoltage").text(lowestBatteryVoltage);

    updateAlerts();
    step = 0;
    playing = false;
    runLog();
    $("#replayScroll").attr("max",logData.length-1).val(0);
    $(".replay-link").css("backgroundColor","");
    if(activeLog){
        $("#" + activeLog).css("backgroundColor","rgb(230,230,230)")
    }
});

socket.on("logList",function(logs){
    $("#matchLogs").html("");
    var hasLogs = false;
    for(var i in logs){
        hasLogs = true;
        var entry = logs[i];
        var error = '<span class="badge badge-danger">3 Errors</span>';
        var warn = '<span class="badge badge-warning">1 Warning</span>';
        var thisDat = new Date(parseFloat(i));
        $("#matchLogs").append('<li class="nav-item"> <a id="' + i + '" title="' + thisDat.toLocaleDateString() + " " + thisDat.toLocaleTimeString() + '" class="nav-link replay-link" href="javascript:void(0)" onclick="socket.emit(\'log\',' + i +'); activeLog = \'' + i + '\'"><span data-feather="file-text" style="color:rgba(' + ((entry.alliance == "red")?'255,0,0':'0,0,255') +  ',0.5)"></span>' + ((entry.eventName.length > 0)?(entry.eventName + " (" + mtypeToReadable(entry.type,true) + ")"):mtypeToReadable(entry.type)) + ((entry.number)?(' #' + entry.number + ((entry.replay > 0)?' (R#' + entry.replay + ')':'')):"") + '</a></li>')
    }
    if(!hasLogs){
        $("#matchLogs").append('<li class="nav-item"> <a class="nav-link replay-link" style="color:gray"><span data-feather="x-square"></span> No Log Data Found</a></li>')
    }
    feather.replace()
})

function updateAutoDetails() {
    if(autoFile.startPosition == "left"){
        $("#startleft").click();
    }else if(autoFile.startPosition == "center"){
        $("#startcenter").click();
    }else if(autoFile.startPosition == "right"){
        $("#startright").click()
    }

    if(autoFile.doSwitch == "true"){
        $("#switchyes").click();
    }else{
        $("#switchno").click();
    }

    if(autoFile.doScale == "true"){
        $("#scaleyes").click();
    }else{
        $("#scaleno").click();
    }
}

function pushAutoToServer() {
    if($("#startleft").parent().hasClass("active")){
        autoFile.startPosition = "left";
    }else if($("#startcenter").parent().hasClass("active")){
        autoFile.startPosition = "center";
    }else if($("#startright").parent().hasClass("active")){
        autoFile.startPosition = "right";
    }

    if($("#switchyes").parent().hasClass("active")){
        autoFile.doSwitch = "true";
    }else if($("#switchno").parent().hasClass("active")){
        autoFile.doSwitch = "false";
    }

    if($("#scaleyes").parent().hasClass("active")){
        autoFile.doScale = "true";
    }else if($("#scaleno").parent().hasClass("active")){
        autoFile.doScale = "false";
    }

    socket.emit("autoData",autoFile);
}

var autoFile = {};
socket.on("autoData",function (data){
    autoFile = data;
    updateAutoDetails();
})

/** LOG REPLAY **/
var activeLog;
var logSpeed = 25;
var logData;
var lastStep = 0;
var step = 0;
var oldData = undefined;
var initialData = undefined;
var playing = false;
var updating = false;
function runLog(dontTimeout){
    if(updating) return;
    updating = true;
    if(step < logData.length){           

        var updatAlert = false;
        if(lastStep > step || Math.abs(step - lastStep) > 1 || dontTimeout){
            updatAlert = true;
            data = JSON.parse(JSON.stringify(initialData));
            for(var z = 0; z < step-1; z++){
                for(var i = 0; i < logData[z].length; i++){
                    for(var j = 0; j < logData[z][i].length; j++){
                        dataHandler(logData[z][i][0],logData[z][i][1])
                    }
                }
            }
        }
        
        if(!oldData){
            oldData = JSON.parse(JSON.stringify(data));
            $("#replayStats").show();
            $("#exitReplay").show();
            $("#deleteReplay").show();
            $("#replay-footer").show();
        }
        //data = logData[step];
        for(var i = 0; i < logData[step].length; i++){
            if(logData[step][i][0].indexOf("dashboard.alerts") > -1) updatAlert = true;
            dataHandler(logData[step][i][0],logData[step][i][1])
        }
        updateDashboard();

        if(updatAlert) updateAlerts();

        updateIndicators();
        lastStep = step;
        if(playing && !dontTimeout){
            step++;
            setTimeout(function(){runLog()},logSpeed);
        }
        $("#replayScroll").val(step);
    }else{
        if(playing){
            playing = false;
            runLog();
        }
    }
    updating = false;
}
function closeLog() {
    data = JSON.parse(JSON.stringify(origData));
    oldData = undefined;
    activeLog = undefined;
    updateDashboard();
    updateAlerts();
    updateIndicators();
    $("#exitReplay").hide();
    $("#replayStats").hide();
    $("#deleteReplay").hide();
    $(".replay-link").css("backgroundColor","");
    $("#replay-footer").hide();
}

function deleteLog() {
    var id = data.recordingStart;
    socket.emit("deleteLog",id);
    closeLog();
}
/** LOG REPLAY **/

var fDE = document.getElementById("fieldDrawing");
var rD = document.getElementById("robotDiagram");
$(document).ready(function(){
    var procInstance = new Processing(fDE,fieldDrawing);
    var rDProcInstance = new Processing(rD,robotDiagram);
});
function fieldDrawing(p){
    p.size(520,400);
    p.background(255);
    p.draw = function() {
        
    	//var mult = (p.width/533);
        
        
        
        //p.text(p.frameCount,10,10)
        p.resetMatrix();
        p.background(255);
        p.fill(0);
        p.pushMatrix();
            p.translate(p.width/2,p.height/2)
            
            if(ready && data.hasOwnProperty("match")){
	            if(data.match.alliance == "blue"){
	                p.scale(-1,1 );
	            }else{
	            	p.scale(1)
	            }
        	}else{
        		p.scale(1)
        	}
            p.translate(-280,-177)

            p.noFill();
            p.stroke(0);
            p.strokeWeight(6);
            p.strokeCap(p.SQUARE);

            p.line(60,80,500,80);
            p.line(60,280,500,280);

            p.rect(110,118,40,120);

            p.rect(270,128,20,100);

            p.rect(410,118,40,120);

            p.stroke(255,0,0)
            p.line(60,80,40,100);
            p.line(40,100,40,260);
            p.line(60,280,40,260)

            p.stroke(0,0,255);
            p.line(500,80,520,100);
            p.line(520,100,520,260)
            p.line(500,280,520,260)

            var colors = {
                redSwitch:{
                    upper:p.color(100),
                    lower:p.color(100)
                },
                balance:{
                    upper:p.color(100),
                    lower:p.color(100)
                },
                blueSwitch:{
                    upper:p.color(100),
                    lower:p.color(100)
                }
            }
            var red = p.color(255,0,0);
            var blue = p.color(0,0,255);
            if(ready && data.hasOwnProperty("match")){
	            if(data.match.gameMessage){
	                var dat = data.match.gameMessage.toLowerCase().split("");

	                colors.redSwitch.upper = (dat[0] == ((data.match.alliance == "red")?"l":"r") )?red:blue;
	                colors.redSwitch.lower = (dat[0] == ((data.match.alliance == "red")?"r":"l") )?red:blue;

	                colors.balance.upper = (dat[1] == ((data.match.alliance == "red")?"l":"r"))?red:blue;
	                colors.balance.lower = (dat[1] == ((data.match.alliance == "red")?"r":"l"))?red:blue;

	                colors.blueSwitch.upper = (dat[2] == ((data.match.alliance == "red")?"l":"r"))?red:blue;
	                colors.blueSwitch.lower = (dat[2] == ((data.match.alliance == "red")?"r":"l"))?red:blue;
	            }
	        }
            p.fill(0,0,0,100);

            p.fill(p.red(colors.redSwitch.upper), p.green(colors.redSwitch.upper),p.blue(colors.redSwitch.upper),150);
            p.stroke(colors.redSwitch.upper); // red switch upper
            p.rect(110,118,40,40);

            p.fill(p.red(colors.redSwitch.lower), p.green(colors.redSwitch.lower),p.blue(colors.redSwitch.lower),150);
            p.stroke(colors.redSwitch.lower); // red switch lower
            p.rect(110,198,40,40);

            p.fill(p.red(colors.balance.upper), p.green(colors.balance.upper),p.blue(colors.balance.upper),150);
            p.stroke(colors.balance.upper); // balance upper
            p.rect(260,118,40,40);

            p.fill(p.red(colors.balance.lower), p.green(colors.balance.lower),p.blue(colors.balance.lower),150);
            p.stroke(colors.balance.lower); // balance lower
            p.rect(260,198,40,40);

            p.fill(p.red(colors.blueSwitch.upper), p.green(colors.blueSwitch.upper),p.blue(colors.blueSwitch.upper),150);
            p.stroke(colors.blueSwitch.upper); // blue switch upper
            p.rect(410,118,40,40);

            p.fill(p.red(colors.blueSwitch.lower), p.green(colors.blueSwitch.lower),p.blue(colors.blueSwitch.lower),150);
            p.stroke(colors.blueSwitch.lower); // blue switch lower
            p.rect(410,198,40,40);

        p.popMatrix();
            p.textAlign(p.CENTER,p.TOP);
            p.textSize(60);
            p.fill(0);
            if(ready && data.hasOwnProperty("match")){
                if(data.match.alliance == "red"){
                    p.fill(255,0,0);
                }else if(data.match.alliance == "blue"){
                    p.fill(0,0,255);
                }else{
                    p.fill(200,0,200);
                }
            }else{
                p.fill(0,0,0);
            }
            p.text((ready&&data.hasOwnProperty("match"))?data.match.alliance.toUpperCase():"NO ALLIANCE",p.width/2,10)
            p.textSize(30);
            p.textAlign(p.CENTER,p.BOTTOM);
            p.fill(100,100,100);
            p.text((ready&&data.hasOwnProperty("match"))?data.match.gameMessage:"NO GAME MESSAGE",p.width/2,p.height-25)
            p.textSize(13);
            p.textAlign(p.LEFT,p.TOP)


    }
}

function robotDiagram(p){
    p.size(280,300);
    p.background(255);
    p.fLBadConnection = false;
    p.fRBadConnection = false;
    p.rLBadConnection = false;
    p.rRBadConnection = false;
    p.draw = function() {
        if(!ready || !data.dashboard.robotConnected){
            p.fLBadConnection = false;
            p.fRBadConnection = false;
            p.rLBadConnection = false;
            p.rRBadConnection = false;
        }
        p.fill(255);
        p.background(255);
        p.stroke(0,0,0);
        p.strokeWeight(3);
        p.rect(p.width/2 - 150/2,p.height - 210,150,180);
        p.rect(90,20,20,70);
        p.rect(170,20,20,70);

        p.fill(200)
        p.rect(p.width/2-30,170,60,60);
        
        var talonthresh = 0.3

        if(ready && (data.driverstation.enabled && Math.floor(p.frameCount/20) % 2 == 0 || !data.driverstation.enabled)){
            p.stroke(255,158,0);
            p.fill(255,118,0);
        }else{
            p.stroke(225,98,0);
            p.fill(200,68,0);
        }
        p.ellipse(p.width/2+15,186,16,16);


        /////////////////
        //  Front Left //
        /////////////////
        if(ready){
            if(!p.fLBadConnection && (data.drivetrain.motorControllers.frontLeft.alive && (data.drivetrain.motorControllers.rearLeft.value <= 0.1 || 
                data.drivetrain.motorControllers.rearLeft.value > talonthresh && data.drivetrain.motorControllers.frontLeft.outputCurrent > 0.3))){
                p.stroke(0,255,0);
                p.fill(0,200,0);
            }else{
                p.stroke(255,0,0);
                p.fill(200,0,0);
                p.fLBadConnection = true;
            }
        }else{
            p.stroke(200);
            p.fill(150);
        }
        p.rect(75,160,25,15);

        /////////////////
        // Front Right //
        /////////////////
        if(ready){
            if(!p.fRBadConnection && (data.drivetrain.motorControllers.frontRight.alive &&(data.drivetrain.motorControllers.rearRight.value <= 0.1 || 
                data.drivetrain.motorControllers.rearRight.value > talonthresh && data.drivetrain.motorControllers.frontRight.outputCurrent > 0.3))){
                p.stroke(0,255,0);
                p.fill(0,200,0);
            }else{
                p.stroke(255,0,0);
                p.fill(200,0,0);
                p.fRBadConnection = true;
            }
        }else{
            p.stroke(200);
            p.fill(150);
        }
        p.rect(180,160,25,15);

        /////////////////
        //   Rear Left //
        /////////////////
        if(ready){
            if(!p.rLBadConnection && (data.drivetrain.motorControllers.rearLeft.alive &&(data.drivetrain.motorControllers.rearLeft.value <= 0.1 || 
                data.drivetrain.motorControllers.rearLeft.value > talonthresh && data.drivetrain.motorControllers.rearLeft.outputCurrent > 0.3))){
                p.stroke(0,255,0);
                p.fill(0,200,0);
            }else{
                p.stroke(255,0,0);
                p.fill(200,0,0);
                p.rLBadConnection = true;
            }
        }else{
            p.stroke(200);
            p.fill(150);
        }
        p.rect(75,200,25,15);

        /////////////////
        //  Rear Right //
        /////////////////
        if(ready){
            if(!p.rRBadConnection && (data.drivetrain.motorControllers.rearRight.alive &&(data.drivetrain.motorControllers.rearRight.value <= 0.1 || 
                data.drivetrain.motorControllers.rearRight.value > talonthresh && data.drivetrain.motorControllers.rearRight.outputCurrent > 0.3))){
                p.stroke(0,255,0);
                p.fill(0,200,0);
            }else{
                p.stroke(255,0,0);
                p.fill(200,0,0);
                p.rRBadConnection = true;
            }
        }else{
            p.stroke(200);
            p.fill(150);
        }
        p.rect(180,200,25,15);
    }
}

$("#replayScroll").on("input",function(){scrolly(this)}).change(function(){scrolly(this)})
function scrolly(ele){
    var newVal = parseFloat($(ele).val());
    if(step == newVal) return;
    step = newVal;
    playing = false;
    runLog();
}
/*setInterval(function() {
    if(step > -1 && data != logData[step]){
        data = logData[step];
    }
},10)*/
