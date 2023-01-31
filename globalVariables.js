var timerValue = null;
var recordingRunning = false;
var recordedData = [];

var remainingDatapointsToBeRecorded = 0;

sampleRateInHz = 50;
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

var myPreviewChart = new Chart(ctx_preview, {
  type: "line",
  data: {
    labels: labelsPreview,
    datasets: [
      {
        label: "power of acceleration in m/s^2",
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
