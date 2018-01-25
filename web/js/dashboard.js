var data = {}; // fetch from server
var ready = false;
var _recording = false;
function isRecording() {
    return _recording || data.driverstation.enabled;
}
function mtypeToReadable() {
    switch(data.match.type){
        case "practice":
        return "Practice";

        case "elimination":
        return "Elimination";

        case "qualification":
        return "Qualification";

        case "none":
        return "Development Testing"

        default:
        return "Unknown Match Type";
    }
}
/*function initMatch(data) {
    match.active = true;
    match.gameStarted = false;
    match.matchType = data.matchType;
    match.matchNumber = data.matchNumber;
    match.replayNumber = data.replayNumber;
    match.eventName = data.eventName;
    $("#matchType").text(mtypeToReadable());
    $("#matchNumber").text("#" + data.matchNumber + ((match.replayNumber >= 1)?" (Replay #"+match.replayNumber+")":""))
}
function startMatch(){
    match.startTime = Date.now();
    match.gameStarted = true;
    match.active = true;
}*/
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


var charts = [];

function newChart(id, settings) {
    var ctx = document.getElementById(id);
    var chart = new Chart(ctx, settings);
    chart.trackedData = [];
    chart.trackedDataOffset = 0;
    chart.timeCap = 5;
    charts.push(chart);
    return chart;
}
//newChart("testChart", genericLineChart());
//newChart("testChart2", genericLineChart());

function fixedNum(num) {
    var str = num.toString();
    return (str.length == 1) ? ("0" + str) : str;
}
function millisTimeStr(){
    var modTime = Date.now() - data.match.startTime;
    var hours = Math.floor(modTime / 1000 / 60 / 60);
    var minutes = Math.floor((modTime - (hours * 1000 * 60 * 60)) / 1000 / 60);
    var seconds = Math.floor((modTime - (hours * 1000 * 60 * 60) - (minutes * 1000 * 60)) / 1000);
    var millis = Math.floor(modTime - (hours * 1000 * 60 * 60) - (minutes * 1000 * 60) - (seconds * 1000))

    var timeStr = fixedNum(Math.floor(minutes)) + ":" + fixedNum(Math.floor(seconds)) + ":" + fixedNum(Math.floor(millis).toString()).substring(0, 2)
    return timeStr;
}
function addData(chart, time, data) {
    chart.trackedData.push(time);
    chart.data.labels.push(millisTimeStr(time));
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
    }

}

/*function startDebugPatterns() {
    
    setInterval(function() {
        addData(
            charts[0],
            Date.now(),
            Math.sin(Date.now() / 150)
        );
    }, 100);
    setInterval(function() {
        addData(
            charts[1],
            Date.now(),
            Math.tan(Date.now() / 150)
        );
    }, 100);
}*/
var panic = false;
var alerts = {
    errors: [
        "disabled",
        "dsoffline",
        "subsysfail",
        "cmdfail",
        "autofail",
        "autocollide",
        "fmsfault"
    ],
    warnings: [
        "brownout"
    ]
}
function updateAlerts() {
    var errorCount = 0;
    for(var i in alerts.errors){
        if(!data.alerts.errors[alerts.errors[i]]){
            $("#err-" + alerts.errors[i]).hide();
        }else{
            errorCount++;
            $("#err-" + alerts.errors[i]).show();
        }
    }
    var warningCount = 0;
    for(var i in alerts.warnings){
        if(!data.alerts.warnings[alerts.warnings[i]]){
            $("#warn-" + alerts.warnings[i]).hide();
        }else{
            warningCount++;
            $("#warn-" + alerts.warnings[i]).show();
        }
    }
    if(errorCount <= 0){
        $("#errors").hide();
    }else{
        $("#errors").show();
    }
    if(warningCount <= 0){
        $("#warnings").hide();
    }else{
        $("#warnings").show();
    }
    $("#err-blackout").hide();
}
/*function setAlertState(alert,state){
    if(alerts.errors.indexOf(alert) > -1){
        if(state == true){
            if(activeAlerts.errors.indexOf(alert) == -1){
                activeAlerts.errors.push(alert);
            }
        }else if(state == false){
            if(activeAlerts.errors.indexOf(alert) > -1){
                activeAlerts.errors.splice(activeAlerts.errors.indexOf(alert),1);
            }
        }else{
            console.error("Invalid Alert State: \"" + state + "\" for Alert \"" + alert + "\"")
            return;
        }
    }else if(alerts.warnings.indexOf(alert) > -1){
        if(state == true){
            if(activeAlerts.warnings.indexOf(alert) > -1){
                activeAlerts.warnings.push(alert);
            }
        }else if(state == false){
            if(activeAlerts.warnings.indexOf(alert) > -1){
                activeAlerts.warnings.splice(activeAlerts.warnings.indexOf(alert),1);
            }
        }else{
            console.error("Invalid Alert State: \"" + state + "\" for Alert \"" + alert + "\"")
            return;
        }
    }else{
        console.error("Invalid Alert Fired! \"" + alert + "\"")
        return;
    }
    updateAlerts();
}*/
var quotes = [
    ["WHEN YOU HAVE COPD, IT CAN BE HARD TO BREATHE","Grandpa Wolf"],
    ["its water game guise", "Dean Kamen"],
    ["Connor's Mom","Fabrication"],
    ["We should use pixy cameras after 2017","Satan"],
    ["It's programming's fault.", "Electronics & Build Depts."],
    ["Told you so","Programming Dept."],
    ["The pixy broke again, where's the calibration file?","Troy Martin"]

]
var lastQuoteUpdate = Date.now();
function randomizeQuote(){
    var quote = quotes[Math.round(Math.random()*(quotes.length-1))];
    $("#quote-text")[0].innerHTML = ("\""+quote[0]+"\"");
    $("#quote-source")[0].innerHTML = (quote[1]);
    lastQuoteUpdate = Date.now();
}
randomizeQuote();

function updateIndicators() {
    $("#matchType")[0].innerHTML = (data.match.eventName + " " + mtypeToReadable());
    $("#matchNumber")[0].innerHTML = ("#" + data.match.number + ((data.match.replay >= 1)?" (Replay #"+match.replayNumber+")":""))

    $("#quote").hide();
    $("#matchHeader").show();
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

    $("#dsd-batteryVoltage")[0].innerHTML = (data.driverstation.batteryVoltage)

    if(data.driverstation.isBrowningOut == true){
        $("#dsd-isBrowningOut").removeClass("badge-secondary").addClass("badge-danger");
    }else{
        $("#dsd-isBrowningOut").addClass("badge-secondary").removeClass("badge-danger");
    }
}
function updateDashboard(){
    if(ready){
        if(Math.floor(Date.now()/500)%2===0 && isRecording()){
            $("link[rel='icon']").attr("href", "icon-active.png");
        }else{
            $("link[rel='icon']").attr("href", "icon.png");
        }
        

    
        if(data.match.startTime > -1){
            $("#matchTime")[0].innerHTML = (millisTimeStr())
        }else{
            $("#matchTime")[0].innerHTML = ("00:00:00")
        }
    }else{
        $("link[rel='icon']").attr("href", "icon.png");

        $("#quote").show();
        $("#matchHeader").hide();

        if(Date.now()-lastQuoteUpdate >= 5*1000){
            randomizeQuote();
        }
        
    }
    if(data.dashboard){
        if(data.dashboard.blackout){
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
    }
}
var socket = io("http://" + host + ":5024"); 

socket.on("connect",function(){
    panic = false;
    console.log("Connected. Sending Authentication request.")
    socket.emit("auth","dashboard")
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
var _recentData = false;
socket.on("data", function(path, value){
    if(path.length == 0){
        if(!ready){
            ready = true;
        }
        data = value;
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
    updateIndicators();
    updateAlerts();
    _recentData = true;
})

socket.on("disconnect", function() {
    ready = false;
    console.warn("Lost Connection to Robot.")
    if(data.driverstation.isBrowningOut){
        if(data.driverstation.enabled){
            data.dashboard.blackout = true;
        }
    }
});
var fDE = document.getElementById("fieldDrawing");
$(document).ready(function(){
    var procInstance = new Processing(fDE,fieldDrawing);
});
function fieldDrawing(p){
    p.size(520,400);
    p.background(255);
    p.draw = function() {
        
    	//var mult = (p.width/533);
        
        
        
        //p.text(p.frameCount,10,10)
        if(!_recentData || p.frameCount == 0) return;
        _recentData = false;
        p.resetMatrix();
        p.background(255);
        p.fill(0);
        p.pushMatrix();
            p.translate(p.width/2,p.height/2)
            
            if(data.hasOwnProperty("match")){
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
            if(data.hasOwnProperty("match")){
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

            p.stroke(colors.redSwitch.upper); // red switch upper
            p.rect(110,118,40,40);

            p.stroke(colors.redSwitch.lower); // red switch lower
            p.rect(110,198,40,40);

            p.stroke(colors.balance.upper); // balance upper
            p.rect(260,118,40,40);

            p.stroke(colors.balance.lower); // balance lower
            p.rect(260,198,40,40);

            p.stroke(colors.blueSwitch.upper); // blue switch upper
            p.rect(410,118,40,40);

            p.stroke(colors.blueSwitch.lower); // blue switch lower
            p.rect(410,198,40,40);

        p.popMatrix();
            p.textAlign(p.CENTER,p.TOP);
            p.textSize(60);
            p.fill(0);
            p.text((data.hasOwnProperty("match"))?data.match.alliance.toUpperCase():"NO ALLIANCE",p.width/2,10)
            p.textSize(30);
            p.textAlign(p.CENTER,p.BOTTOM);
            p.text((data.hasOwnProperty("match"))?data.match.gameMessage:"NO GAME MESSAGE",p.width/2,p.height-25)
            p.textSize(13);
            p.textAlign(p.LEFT,p.TOP)


    }
}