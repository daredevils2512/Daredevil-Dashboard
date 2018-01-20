var match = {
    active:false,
    gameStarted:false,
    matchType:"none",
    matchNumber:1,
    replayNumber:1,
    eventName:"EHS",
    gameMessage:"",
    startTime:0
}
function mtypeToReadable() {
    switch(match.matchType){
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
function initMatch(data) {
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
newChart("testChart", genericLineChart());
newChart("testChart2", genericLineChart());

function fixedNum(num) {
    var str = num.toString();
    return (str.length == 1) ? ("0" + str) : str;
}
function millisTimeStr(time){
    var modTime = time - match.startTime;
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

function startDebugPatterns() {
    initMatch({
        matchType:"none",
        matchNumber:1,
        replayNumber:1,
        eventName:"2512 Debug"
    })
    startMatch();
    
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
}

var alerts = {
    errors: [
        "brownout",
        "disabled",
        "dsoffline",
        "subsysfail",
        "cmdfail",
        "autofail",
        "autocollide",
        "fmsfault"
    ],
    warnings: [
        "lowvoltage"
    ]
}
var activeAlerts = {
    errors:[],
    warnings:[]
}
function updateAlerts() {
    for(var i = 0; i < alerts.errors.length; i++){
        if(activeAlerts.errors.indexOf(alerts.errors[i]) == -1){
            $("#err-" + alerts.errors[i]).hide();
        }else{
            $("#err-" + alerts.errors[i]).show();
        }
    }
    for(var i = 0; i < alerts.warnings.length; i++){
        if(activeAlerts.warnings.indexOf(alerts.warnings[i]) == -1){
            $("#warn-" + alerts.warnings[i]).hide();
        }else{
            $("#warn-" + alerts.warnings[i]).show();
        }
    }
    if(activeAlerts.errors.length <= 0){
        $("#error").hide();
    }else{
        $("#error").show();
    }
    if(activeAlerts.warnings.length <= 0){
        $("#warnings").hide();
    }else{
        $("#warnings").show();
    }
}
function setAlertState(alert,state){
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
}
var quotes = [
    ["WHEN YOU HAVE COPD, IT CAN BE HARD TO BREATHE","Grandpa Wolf"],
    ["its water game guise", "Dean kamen"],
    ["Connor's Mom","Fabrication"],
    ["We should use pixy cameras after 2017","Satan"],
    ["It's programming's fault.", "Electronics & Build Depts."],
    ["Told you so","Programming Dept."],
    ["The pixy broke again, where's the calibration file?","Troy Martin"]

]
var lastQuoteUpdate = Date.now();
function randomizeQuote(){
    var quote = quotes[Math.round(Math.random()*(quotes.length-1))];
    $("#quote-text").text("\""+quote[0]+"\"");
    $("#quote-source").text(quote[1]);
    lastQuoteUpdate = Date.now();
}
randomizeQuote();
function updateDashboard(){
    if(match.active){
        $("link[rel='icon']").attr("href", "icon-active.png");
        $("#quote").hide();
        $("#matchHeader").show();
    
        if(match.gameStarted){
            $("#matchTime").text(millisTimeStr(Date.now()))
        }else{
            $("#matchTime").text("00:00:00")
        }

    }else{
        $("link[rel='icon']").attr("href", "icon.png");

        $("#quote").show();
        $("#matchHeader").hide();

        if(Date.now()-lastQuoteUpdate >= 5*1000){
            randomizeQuote();
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
    console.log("connected.")
})