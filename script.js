
var timeBetweenReadings = 20;
let lastTimestamp = 0;
let interval = 1000 / 50;

let browserInfo = detectBrowser();

let browserInfoString = `${browserInfo.name}:${browserInfo.version}`;

let permissionContainer = document.getElementById("permissionContainer");

if (browserInfoString.includes('afari')) {
  permissionContainer.style.display = 'initial'
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
    rawData.innerHTML = `recording took ${endOfRecordingInMilliseconds - startOfRecordingInMilliseconds} milliseconds (${recordedDataX.length} xyz-datapoints) `;
    recordingRunning = false;
    modal.style.display = "block";
    displayPreviewGraph();
    if (timerValue === undefined) {
      alert("error: timerValue undefined");
    }
    recordButton.innerHTML = "Starte neue Aufnahme";
  }

  tensorflowdata = addXYZ( tensorflowdata, [x,y,z]);

  //window.addDataXYZ(x, y, z);
  postDatapointToWorker(x, y, z);
}

// This function applies a 50 Hz low-pass filter on a two dimensional array of acceleration data
// The array should have the form [[x1,y1,z1], [x2,y2,z2], ...] where each element is a number
// The function returns a new array with the filtered data
// The function uses a simple finite impulse response (FIR) filter with a fixed coefficient
// For more information on FIR filters, see https://stackoverflow.com/questions/35530/what-are-high-pass-and-low-pass-filters

function lowPassFilter(data) {
  // Check if the input is a valid array
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  // Define the filter coefficient (this can be adjusted for different cutoff frequencies)
  var kFilteringFactor = 0.9;

  // Initialize the output array and the previous filtered value
  var output = [];
  var prev = [0, 0, 0];

  // Loop through the input array
  for (var i = 0; i < data.length; i++) {
    // Check if the current element is a valid array of three numbers
    if (!Array.isArray(data[i]) || data[i].length !== 3 || data[i].some(isNaN)) {
      return null;
    }

    // Apply the filter formula to each axis
    var x = data[i][0] * kFilteringFactor + prev[0] * (1 - kFilteringFactor);
    var y = data[i][1] * kFilteringFactor + prev[1] * (1 - kFilteringFactor);
    var z = data[i][2] * kFilteringFactor + prev[2] * (1 - kFilteringFactor);

    // Store the filtered value in the output array
    output.push([x, y, z]);

    // Update the previous filtered value
    prev = [x, y, z];
  }

  // Return the output array
  return output;
}


function addXYZ(array, point) {
  let mldisplay = document.getElementById("mlresult");
  // Check if the point is a valid xyz-datapoint of form [1.0,2.0,3.0]
  if (Array.isArray(point) && point.length === 3 && point.every(x => typeof x === 'number')) {
    // Copy the original array to avoid mutating it
    let newArray = [...array];
    // Check if the array is full
    if (newArray.length === 50) {
      // Remove the first element (the oldest one)
      newArray.shift();
    }
    // Add the new point at the end of the array
    newArray.push(point);
    if(hostedTensorflowModel !== undefined){
      newArrayFiltered = lowPassFilter(newArray);
      let extractedFeaturesOfPoint = extractFeatures(newArrayFiltered);
      
      // let Xs = arrayToTensor2d(extractedFeaturesOfPoint);
      // let prediction = hostedTensorflowModel.predict(Xs);
      // prediction = tf.argMax(prediction, axis = 1).dataSync();

      let Xs = tf.tensor(extractedFeaturesOfPoint, [1, 15]);
      let prediction = hostedTensorflowModel.predict(Xs);
      let result = oneHotDecode(prediction);
      //const index = prediction.argMax(-1).dataSync()[0];
      
      if(result !== undefined && result !== null){
        mldisplay.innerHTML = `${result}`;
      }
    }
    // Return the new array
    return newArray;
  } else {
    // Throw an error if the point is not valid
    throw new Error('Invalid xyz-datapoint');
  }
}

// This function takes an array of 15 values and returns a tensor2d object
// The tensor2d object can be used as a parameter for the model.predict method
// The function assumes that the array has a valid length and contains numeric values
function arrayToTensor2d(array) {
  // Create a new tensor1d from the array
  let tensor1d = tf.tensor1d(array);
  // Reshape the tensor1d into a tensor2d with shape [1, 15]
  let tensor2d = tensor1d.reshape([1, 15]);
  // Return the tensor2d object
  return tensor2d;
}

function extractFeatures(data) {
  // Initialize an empty array to store the features
  let features = [];

  // Loop through each axis (x, y and z)
  for (let i = 0; i < 3; i++) {
      // Initialize variables to store the sum, mean, variance, standard deviation, minimum, maximum and range of the current axis
      let sum = 0;
      let mean = 0;
      let variance = 0;
      let std = 0;
      let min = Infinity;
      let max = -Infinity;
      let range = 0;

      // Loop through each value of the current axis
      for (let j = 0; j < data.length; j++) {
          // Get the current value
          let value = data[j][i];

          // Update the sum
          sum += value;

          // Update the minimum and maximum
          if (value < min) {
              min = value;
          }
          if (value > max) {
              max = value;
          }
      }

      // Calculate the mean
      mean = sum / data.length;

      // Loop through each value of the current axis again
      for (let j = 0; j < data.length; j++) {
          // Get the current value
          let value = data[j][i];

          // Update the variance
          variance += Math.pow(value - mean, 2);
      }

      // Calculate the standard deviation
      std = Math.sqrt(variance / data.length);

      // Calculate the range
      range = max - min;

      // Push the features of the current axis to the array
      features.push(mean, std, min, max, range);
  }

  // Return the array of features
  return features;
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
      numberOfDatapointsToBeRecorded = Number(localStorage.getItem("data"));
      //alert(`recording: ${numberOfDatapointsToBeRecorded} datapoints`);
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

  var label = localStorage.getItem("localStorageLabel");

  var timestamp = new Date().getTime();
  filename = `AccelerationData_${timestamp}_[${label}].json`;

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

