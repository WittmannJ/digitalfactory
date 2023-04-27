
var timeBetweenReadings = 20;
let lastTimestamp = 0;
let interval = 1000 / 50;

let browserInfo = detectBrowser();

let browserInfoString = `${browserInfo.name}:${browserInfo.version}`;

if (browserInfoString.includes('afari')) {
  getAccel(); // get permission to use sensors
}

if ("LinearAccelerationSensor" in window && "Gyroscope" in window) {
  document.getElementById("moApi").innerHTML = ("Generic Sensor API " + browserInfoString);

  let lastReadingTimestamp;
  let accelerometer = new LinearAccelerationSensor({
    frequency: 50,
  });
  accelerometer.addEventListener("reading", (e) => {
    if (lastReadingTimestamp) {
      intervalHandler(
        Math.round(accelerometer.timestamp - lastReadingTimestamp)
      );
    }
    lastReadingTimestamp = accelerometer.timestamp;
    accelerationHandler(accelerometer, "moAccel");
  });
  accelerometer.start();
} else if ("DeviceMotionEvent" in window) {
  document.getElementById("moApi").innerHTML = "Device Motion API " + browserInfoString;

  var onDeviceMotion;
  if (false) {
    onDeviceMotion = function (eventData) {
      //accelerationHandler(eventData.acceleration, 'moAccel');
      accelerationHandler(eventData.accelerationIncludingGravity, "moAccelGrav");
      //rotationHandler(eventData.rotationRate);
      intervalHandler(eventData.interval);
    };
  }
  onDeviceMotion = function (eventData) {
    let currentTimestamp = eventData.timeStamp;
    let difference = currentTimestamp - lastTimestamp
    if (difference >= interval) {
      lastTimestamp = currentTimestamp;
      //accelerationHandler(eventData.acceleration, 'moAccel');
      accelerationHandler(eventData.acceleration, "moAccel");
      //rotationHandler(eventData.rotationRate);
      intervalHandler(difference);
      if (difference > 20) {
        interval = interval - 0.01;
      }

    }

  };

  window.addEventListener("devicemotion", onDeviceMotion, false);
} else {
  document.getElementById("moApi").innerHTML =
    "No Accelerometer & Gyroscope API available";
}

function getAccel() {

  DeviceMotionEvent.requestPermission().then(response => {
    if (response == 'granted') {
      console.log("accelerometer permission granted");
      // Do stuff here

    }

  });
}

function accelerationHandler(acceleration, targetId) {
  var info,
    xyz = "[X, Y, Z]";

  let x = acceleration.x;
  let y = acceleration.y;
  let z = acceleration.z;
  //alert(acceleration.x);


  info = xyz.replace("X", acceleration.x && acceleration.x.toFixed(3));
  info = info.replace("Y", acceleration.y && acceleration.y.toFixed(3));
  info = info.replace("Z", acceleration.z && acceleration.z.toFixed(3));
  document.getElementById(targetId).innerHTML = info;

  /*var power = Math.sqrt(
    x ** 2 +
      y ** 2 +
      z ** 2
  );*/

  // store new datapoint if necessary
  if (recordingRunning && remainingDatapointsToBeRecorded > 0) {

    recordedDataX.push(x);
    recordedDataY.push(y);
    recordedDataZ.push(z);
    remainingDatapointsToBeRecorded--;
  } else if (recordingRunning && remainingDatapointsToBeRecorded === 0) {
    endOfRecordingInMilliseconds = Date.now();
    rawData.innerHTML = `recording took ${endOfRecordingInMilliseconds - startOfRecordingInMilliseconds} milliseconds`;
    recordingRunning = false;
    modal.style.display = "block";
    displayPreviewGraph();
    if (timerValue === undefined) {
      alert("error: timerValue undefined");
    }
    recordButton.innerHTML = "Starte neue Aufnahme";
  }

  //window.addDataXYZ(x, y, z);
  postDatapointToWorker(x, y, z);
}

async function postDatapointToWorker(x, y, z) {
  worker.postMessage([x, y, z]);
}

function rotationHandler(rotation) {
  var info,
    xyz = "[X, Y, Z]";

  info = xyz.replace("X", rotation.alpha && rotation.alpha.toFixed(3));
  info = info.replace("Y", rotation.beta && rotation.beta.toFixed(3));
  info = info.replace("Z", rotation.gamma && rotation.gamma.toFixed(3));
  document.getElementById("moRotation").innerHTML = info;
}

async function intervalHandler(interval) {
  intervalElement.innerHTML = interval;
}

// When the user clicks on the button, open the modal
/*btn.onclick = function () {
  modal.style.display = "block";
};*/

downloadJSON.onclick = function () {
  download_json_file();
};

closeModalBtn.onclick = function () {
  window.resetRecordedData();
  modal.style.display = "none";
};

// When the user clicks on <span> (x), close the modal
span.onclick = function () {
  window.resetRecordedData();
  modal.style.display = "none";
};

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
  if (event.target == modal) {
    window.resetRecordedData();
    modal.style.display = "none";
  }
};

if (timerValue === undefined || timerValue === null || timerValue < 0) {
  recordButton.disabled = true;
}

recordButton.onclick = function () {
  startRecordingWithTimer(timerValue);
};

function startRecordingWithTimer(timerValue) {
  // Set the date we're counting down to

  // Set the date we're counting down to
  var now = new Date().getTime();
  var countDownDate = addSeconds(now, parseInt(timerValue));

  // Update the count down every 1 second
  var x = setInterval(function () {
    // Get today's date and time
    var now = new Date().getTime();

    // Find the distance between now and the count down date
    var distance = Math.ceil((countDownDate - now) / 1000);

    recordButton.innerHTML = `Aufnahme startet in: ${distance} seconds`;

    // If the count down is finished, write some text
    if (distance < 0) {
      clearInterval(x);
      recordButton.innerHTML = "Aufnahme läuft";
      startRecordingOfDatapoints(numberOfDatapointsToBeRecorded);
    }
  }, 1000);
}

function startRecordingOfDatapoints(numberOfDatapointsToBeRecorded) {
  recordedData = [];
  recordingRunning = true;
  remainingDatapointsToBeRecorded = numberOfDatapointsToBeRecorded;
  startOfRecordingInMilliseconds = Date.now();
}

function download_json_file_demo() {
  const ARRAY_LENGTH = 10;
  const randomArray = [];
  for (let i = 0; i < ARRAY_LENGTH; i++) {
    randomArray.push(Math.random());
  }
  recordedData = randomArray;
  download_json_file();
}

function download_json_file() {
  //var json = JSON.parse(recordedData);
  // format: [[x1,y1,z1],[x2,y2,z2],[x3,y3,z3]]


  // create 2-D array with each entry being a subarray containing one reading from each axis => [x0, y0, z0] for the first entry
  let arr2d = new Array(recordedDataX.length);
  for (let i = 0; i < arr2d.length; i++) {
    let xi = recordedDataX[i];
    let yi = recordedDataY[i];
    let zi = recordedDataZ[i];
    arr2d[i] = [xi, yi, zi];
  }

  var json = JSON.stringify(arr2d);

  var timestamp = new Date().getTime();
  filename = `AccelerationData_${timestamp}.json`;

  var jsonFile;
  var downloadLink;

  //define the file type to text/csv
  jsonFile = new Blob([json], { type: "application/json" });
  downloadLink = document.createElement("a");
  downloadLink.download = filename;
  downloadLink.href = window.URL.createObjectURL(jsonFile);
  downloadLink.style.display = "none";

  document.body.appendChild(downloadLink);
  downloadLink.click();
  modal.style.display = "none";
  window.resetRecordedData();
}



function displayPreviewGraph() {
  let newPreviewLabels = [];
  recordedDataX.forEach((datapoint) => {
    newPreviewLabels.push(" ");
  });

  myPreviewChart.data.labels = newPreviewLabels;

  myPreviewChart.data.datasets[0].data = recordedDataX;
  myPreviewChart.data.datasets[1].data = recordedDataY;
  myPreviewChart.data.datasets[2].data = recordedDataZ;
  myPreviewChart.update();
}

function addData(value) {
  if (value === undefined) {
    value = Math.random() * (19 - 5) + 9;
  }
  //var
  //remove the oldest entry
  myChart.data.datasets[0].data.shift();
  myChart.data.labels.shift();

  myChart.data.datasets[0].data.push(value);
  myChart.data.labels.push(" ");
  myChart.update();
}

async function addDataXYZ(x, y, z) {
  myChart.data.datasets[0].data.shift();
  myChart.data.datasets[1].data.shift();
  myChart.data.datasets[2].data.shift();
  myChart.data.labels.shift();

  myChart.data.datasets[0].data.push(x);
  myChart.data.datasets[1].data.push(y);
  myChart.data.datasets[2].data.push(z);
  myChart.data.labels.push(" ");
  /*numberOfPointsSinceLastUpdate++;
  
  if(numberOfPointsSinceLastUpdate >= updateChartAfterHowManyDatapoints){
    numberOfPointsSinceLastUpdate = 0;
    myChart.update();
  }*/



  if (!recordingRunning) {
    myChart.update();
  }
}

function getRandomNumber(max) {
  return Math.floor(Math.random() * max);
}

function workerSayHi() {
  let max = 20;
  let x = getRandomNumber(10);
  let y = getRandomNumber(15);
  let z = getRandomNumber(20);
  worker.postMessage([x, y, z]);
}

