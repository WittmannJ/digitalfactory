var timerValue = null;
var recordingRunning = false;
var recordedData = [];

var recordedDataX = [];
var recordedDataY = [];
var recordedDataZ = [];

var xData = [];
var yData = [];
var zData = [];

function resetRecordedData() {
  recordedDataX = [];
  recordedDataY = [];
  recordedDataZ = [];

}

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
worker.postMessage({ ctx: offscreenCanvas, myChartConfig, "width": screen.width, "height": screen.height }, [offscreenCanvas]);


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
      {
        label: "y in m/s^2",
        data: dataPreview,
        borderWidth: 1,
      },
      {
        label: "z in m/s^2",
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


navigator.saysWho = (() => {
  const { userAgent } = navigator
  let match = userAgent.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || []
  let temp

  if (/trident/i.test(match[1])) {
    temp = /\brv[ :]+(\d+)/g.exec(userAgent) || []

    return `IE ${temp[1] || ''}`
  }

  if (match[1] === 'Chrome') {
    temp = userAgent.match(/\b(OPR|Edge)\/(\d+)/)

    if (temp !== null) {
      return temp.slice(1).join(' ').replace('OPR', 'Opera')
    }

    temp = userAgent.match(/\b(Edg)\/(\d+)/)

    if (temp !== null) {
      return temp.slice(1).join(' ').replace('Edg', 'Edge (Chromium)')
    }
  }

  match = match[2] ? [match[1], match[2]] : [navigator.appName, navigator.appVersion, '-?']
  temp = userAgent.match(/version\/(\d+)/i)

  if (temp !== null) {
    match.splice(1, 1, temp[1])
  }

  return match.join(' ')
})()

// This function returns the name and version of the browser based on the user agent string
function detectBrowser() {
// Get the user agent string from the navigator object
let userAgent = navigator.userAgent;

// Declare variables for storing the browser name and version
let browserName, browserVersion;

// Check if the user agent contains "Opera" or "OPR"
if (/Opera|OPR/.test(userAgent)) {
// Set the browser name to "Opera"
browserName = "Opera";
// Extract the browser version from the user agent string
browserVersion = userAgent.match(/(?:Opera|OPR)\/(\d+\.\d+)/)[1];
}
// Check if the user agent contains "Edg"
else if (/Edg/.test(userAgent)) {
// Set the browser name to "Edge (Chromium)"
browserName = "Edge (Chromium)";
// Extract the browser version from the user agent string
browserVersion = userAgent.match(/Edg\/(\d+\.\d+)/)[1];
}
// Check if the user agent contains "Chrome"
else if (/Chrome/.test(userAgent)) {
// Set the browser name to "Chrome"
browserName = "Chrome";
// Extract the browser version from the user agent string
browserVersion = userAgent.match(/Chrome\/(\d+\.\d+)/)[1];
}
// Check if the user agent contains "Safari"
else if (/Safari/.test(userAgent)) {
// Set the browser name to "Safari"
browserName = "Safari";
// Extract the browser version from the user agent string
browserVersion = userAgent.match(/Version\/(\d+\.\d+)/)[1];
}
// Check if the user agent contains "Firefox"
else if (/Firefox/.test(userAgent)) {
// Set the browser name to "Firefox"
browserName = "Firefox";
// Extract the browser version from the user agent string
browserVersion = userAgent.match(/Firefox\/(\d+\.\d+)/)[1];
}
// Check if the user agent contains "MSIE" or "Trident"
else if (/MSIE|Trident/.test(userAgent)) {
// Set the browser name to "Internet Explorer"
browserName = "Internet Explorer";
// Extract the browser version from the user agent string
browserVersion = userAgent.match(/(?:MSIE |rv:)(\d+\.\d+)/)[1];
}
else {
// Set the browser name to "Unknown"
browserName = "Unknown";
// Set the browser version to "Unknown"
browserVersion = "Unknown";
}

// Return an object with the browser name and version properties
return {
name: browserName,
version: browserVersion
};
}