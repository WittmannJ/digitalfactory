var timerValue = null;
var recordingRunning = false;
var recordedData = [];

var xData = [];
var yData = [];
var zData = [];

var intervalElement = document.getElementById("moInterval");

var remainingDatapointsToBeRecorded = 0;

var sampleRateInHz = 50;
recordingDurationInSeconds = 3;

numberOfDatapointsToBeRecorded = sampleRateInHz * recordingDurationInSeconds;
var recordingButtonText = "";
// Get the modal
var modal = document.getElementById("myModal");

var rawData = document.getElementById("rawData");

// Get the button that opens the modal
//var btn = document.getElementById("recordButton");

var downloadJSON = document.getElementById("downloadJSON");

var closeModalBtn = document.getElementById("closeModalButton");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

var recordButton = document.getElementById("recordButton");

recordButton.innerHTML = `Bitte setze einen Timer`;

var setInterval_ID = undefined;

function addSeconds(dateInMilliseconds, seconds) {
  // multiplied by 1000 to convert seconds to milliseconds
  return dateInMilliseconds + seconds * 1000;
}

const ctx_preview = document.getElementById("myPreviewChart");

var labelsPreview = [];

var dataPreview = new Array(200).fill(0);

dataPreview.forEach((x) => {
  labelsPreview.push(" ");
});

var ctx = document.getElementById("myChart");
var offscreenCanvas = ctx.transferControlToOffscreen();

var data = new Array(200).fill(0);

xData = new Array(200).fill(10);
yData = new Array(200).fill(20);
zData = new Array(200).fill(30);

var labels = [];

data.forEach((x) => {
  labels.push(" ");
});

myChartConfig = {
  type: "line",
  data: {
    labels: labels,
    datasets: [
      {
        label: "x in m/s^2",
        data: xData,
        pointRadius: 0,
        borderWidth: 2,
        
      },
      {
        label: "y in m/s^2",
        data: yData,
        pointRadius: 0,
        borderWidth: 2,
      },
      {
        label: "z in m/s^2",
        data: zData,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  },
  options: {
    devicePixelRatio: 3,
    parsing: true,
    responsive: true,
    animation: false,
    scales: {
      y: {
        type: "linear"
      },
    },
    spanGaps: true,
    plugins: {
      tooltip: {
        enabled: false, // <-- this option disables tooltips
      },
    },
  },
}

//var myChart = new Chart(ctx, myChartConfig);
const worker = new Worker('worker.js');
worker.postMessage({ctx: offscreenCanvas, myChartConfig, "width": screen.width, "height": screen.height}, [offscreenCanvas]);


var startOfRecordingInMilliseconds;
var endOfRecordingInMilliseconds;
var recordingDurationInMilliseconds;

var myDate = new Date();

var updateChartAfterHowManyDatapoints = 25;
var numberOfPointsSinceLastUpdate = 0;


var myPreviewChart = new Chart(ctx_preview, {
  type: "line",
  data: {
    labels: labelsPreview,
    datasets: [
      {
        label: "x in m/s^2",
        data: dataPreview,
        borderWidth: 1,
      },
    ],
  },
  options: {
    responsive: true,
    animation: false,
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  },
});
