// A javascript method that can reverse the one-hot encoding in a tensor2d object to get the original labels

function oneHotDecode(tensor) {
    // Get the array representation of the tensor
    let array = tensor.arraySync();
    // Get the stored labels from the localstorage of the browser
    let labels = JSON.parse(localStorage.getItem("labels"));
    // Create an empty array to store the decoded labels
    let decoded = [];
    // Loop through each vector in the array
    for (let vector of array) {
        // Find the index of the element with the highest probability (1)
        let index = vector.indexOf(Math.max(...vector));
        // Get the label at that index from the stored labels
        let label = labels[index];
        // Push the label to the decoded array
        decoded.push(label);
    }
    // Return the decoded array
    return decoded;
}
// async function processFiles() {
//     const fileInput = document.getElementById('fileInput');
//     const files = fileInput.files;
//     const recordings = [];

//     // Iterate through each file
//     for (let i = 0; i < files.length; i++) {
//         const file = files[i];
//         const reader = new FileReader();

//         // Read the contents of the file
//         reader.onload = async function (e) {
//             const content = e.target.result;
//             const json = JSON.parse(content);
//             const milliseconds = extractMillisecondsFromFilename(file.name);
//             const label = extractLabelFromFilename(file.name);

//             // Process the JSON data
//             const recordingsData = json.map(entry => entry.slice(0, 3)); // Extract only x, y, z values
//             const numRecordings = Math.floor(recordingsData.length / 50);

//             // Cut into 1-second recordings with 50 xyz-datapoints per recording
//             for (let j = 0; j < numRecordings; j++) {
//                 const start = j * 50;
//                 const end = start + 50;
//                 const recording = recordingsData.slice(start, end);

//                 // Extract suitable features (you need to implement this part)
//                 const features = extractFeatures(recording);

//                 // Create a training sample
//                 const trainingSample = {
//                     features: features,
//                     label: label
//                 };

//                 // Add the training sample to the array
//                 recordings.push(trainingSample);
//             }

//             // Train the TensorFlow.js model (you need to implement this part)

//         };

//         reader.readAsText(file);
//     }
//     await trainModel(recordings);

// }


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

async function processFiles() {
    var tensorflowButton = document.getElementById("tensorflowButton");
    tensorflowButton.innerHTML = "running pre-processing";
    tensorflowButton.disabled = true;
    const fileInput = document.getElementById('fileInput');
    const files = fileInput.files;
    const recordings = [];

    // Create an array of promises
    const promises = [];

    // Iterate through each file
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();

        // Create a promise for each reader.onload function
        const promise = new Promise((resolve, reject) => {
            // Read the contents of the file
            reader.onload = async function (e) {
                const content = e.target.result;
                const json = JSON.parse(content);
                const milliseconds = extractMillisecondsFromFilename(file.name);
                const label = extractLabelFromFilename(file.name);

                // Process the JSON data
                const recordingsData = json.map(entry => entry.slice(0, 3)); // Extract only x, y, z values
                const numRecordings = Math.floor(recordingsData.length / 50);

                // Cut into 1-second recordings with 50 xyz-datapoints per recording
                for (let j = 0; j < numRecordings; j++) {
                    const start = j * 50;
                    const end = start + 50;
                    const recording = recordingsData.slice(start, end);

                    recordingFiltered = lowPassFilter(recording);

                    // Extract suitable features (you need to implement this part)
                    const features = extractFeatures(recordingFiltered);

                    // Create a training sample
                    const trainingSample = {
                        features: features,
                        label: label
                    };

                    // Add the training sample to the array
                    recordings.push(trainingSample);
                }

                // Resolve the promise with the recordings array
                resolve(recordings);
            };

            reader.readAsText(file);
        });

        // Add the promise to the array
        promises.push(promise);
    }

    // Wait for all the promises to resolve
    const results = await Promise.all(promises);

    // Concatenate all the recordings arrays into one
    const allRecordings = results.reduce((acc, curr) => acc.concat(curr), []);

    // Train the TensorFlow.js model (you need to implement this part)
    await trainModel(allRecordings);
}

function extractMillisecondsFromFilename(filename) {
    const parts = filename.split('_');
    const millisecondsPart = parts[1];
    return millisecondsPart.substring(0, millisecondsPart.indexOf('['));
}

function extractLabelFromFilename(filename) {
    const parts = filename.split('[');
    return parts[1].substring(0, parts[1].indexOf(']'));
}

/**
 * This method extracts 5 basic features from a two dimensional array containing 50 xyz-acceleration values.
 * The features are: mean, standard deviation, minimum, maximum and range of each axis.
 * The method returns a one dimensional array containing all extracted features in the order of x-mean, x-std, x-min, x-max, x-range, y-mean, y-std, y-min, y-max, y-range, z-mean, z-std, z-min, z-max and z-range.
 * @param {number[][]} data - A two dimensional array of 50 xyz-acceleration values.
 * @returns {number[]} An array of 15 extracted features.
 */
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

// A javascript method that can apply one-hot encoding on an array containing labels and transforms the array into a tensor2d object
function oneHotEncode(labels) {
    storeLabels(labels);
    // Get the number of unique labels
    let numLabels = [...new Set(labels)].length;
    // Create an empty array to store the encoded vectors
    let encoded = [];
    // Loop through each label
    for (let label of labels) {
        // Create a zero-filled vector of length numLabels
        let vector = new Array(numLabels).fill(0);
        // Find the index of the label in the sorted set of unique labels
        let index = [...new Set(labels)].sort().indexOf(label);
        // Set the value at that index to 1
        vector[index] = 1;
        // Push the vector to the encoded array
        encoded.push(vector);
    }
    // Convert the encoded array into a tensor2d object
    let tensor = tf.tensor2d(encoded);
    // Return the tensor
    return tensor;
}



// Store the necessary variables of the one-hot encoder in the localstorage of the browser
function storeLabels(labels) {
    // Get the sorted set of unique labels from the array
    let uniqueLabels = [...new Set(labels)].sort();
    // Convert the set into a JSON string
    let jsonString = JSON.stringify(uniqueLabels);
    // Store the string in the localstorage with the key "labels"
    localStorage.setItem("labels", jsonString);
}



async function trainModel(recordings) {
    try {
        alert(tf.getBackend());
        var tensorflowButton = document.getElementById("tensorflowButton");
        tensorflowButton.innerHTML = "start training tensorflow-js model";
        const xs = tf.tensor2d(recordings.map(r => r.features));
        const labels = recordings.map(r => r.label);

        let ys = oneHotEncode(labels);

        // // Convert labels to one-hot encoded vectors
        const uniqueLabels = Array.from(new Set(labels));
        // console.log("uniqueLabels");
        // console.log(uniqueLabels);
        // alert(uniqueLabels);
        // let oneHotEncodedLabels = labels.map(label => uniqueLabels.map(ul => ul === label ? 1 : 0));
        // const ys = tf.tensor2d(
        //     oneHotEncodedLabels
        // );

        console.log(ys);
        ys.print();

        // Define the model architecture
        const model = tf.sequential();
        model.add(tf.layers.dense({ units: 32, activation: 'relu', inputShape: [15] }));
        model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
        model.add(tf.layers.dense({ units: 8, activation: 'relu' }));
        model.add(tf.layers.dense({ units: 4, activation: 'relu' }));
        model.add(tf.layers.dense({ units: uniqueLabels.length, activation: 'softmax' }));

        // Compile the model
        model.compile({ loss: 'categoricalCrossentropy', optimizer: 'adam', metrics: ['accuracy'] });

        // Define a variable to store the start time
        let startTime;
        var progressBar = document.querySelector(".progress-bar");
        progressBar.setAttribute("aria-valuenow", 0);
        progressBar.style.width = 0 + "%";
        progressBar.textContent = 0 + "%";

        // Define a custom callback function
        const printCallback = new tf.CustomCallback({
            // Implement the onTrainBegin method
            onTrainBegin: () => {
                // Get the current time in milliseconds
                startTime = performance.now();
            },
            // Implement the onEpochEnd method
            onEpochEnd: (epoch, logs) => {
                // Get the current time in milliseconds
                let currentTime = performance.now();
                // Calculate the elapsed time in seconds
                let elapsedTime = (currentTime - startTime) / 1000;
                // Get the loss value from the logs object
                let loss = logs.loss;
                // Print the epoch number, elapsed time and loss value
                var tensorflowButton = document.getElementById("tensorflowButton");
                tensorflowButton.innerHTML = `training in progress - Epoch ${epoch + 1}: ${elapsedTime.toFixed(2)}s - loss: ${loss.toFixed(4)}`;
                console.log(`Epoch ${epoch + 1}: ${elapsedTime.toFixed(2)}s - loss: ${loss.toFixed(4)}`);
                let newValue = ((epoch + 1) / 20) * 100;
                progressBar.setAttribute("aria-valuenow", newValue);
                progressBar.style.width = newValue + "%";
                // Set the new text of the progress bar
                progressBar.textContent = newValue + "%";
                //alert(`Epoch ${epoch + 1}: ${elapsedTime.toFixed(2)}s - loss: ${loss.toFixed(4)}`);
            }
        });


        model.summary();

        // Train the model
        const history = await model.fit(xs, ys, { epochs: 20, callbacks: [printCallback] });
        console.log(history.history.loss);

        const result = model.evaluate(xs, ys);

        // Print the accuracy
        const accuracy = result[1].dataSync()[0]; // result[1] is the accuracy metric
        console.log('Accuracy: ' + accuracy);
        let performanceContainer = document.getElementById("modelPerformance");
        //performanceContainer.innerHTML = 'Accuracy: ' + accuracy

        var tensorflowButton = document.getElementById("tensorflowButton");
        tensorflowButton.innerHTML = `Done with training! Achieved accuracy: ${accuracy}. Click to train a new model!`;
        tensorflowButton.disabled = false;
        // Make predictions with the trained model
        const predictions = model.predict(xs);
        predictions.print();
        let results = oneHotDecode(predictions);
        console.log(results);
        // const predictedLabels = tf.argMax(predictions, axis = 1).dataSync();

        // // Convert predicted labels to their corresponding class names
        // //const predictedClasses = predictedLabels.map(labelIndex => uniqueLabels[labelIndex]);
        // const predictedClasses = mapLabels(predictedLabels);

        // // Print the predicted classes
        // console.log(predictedClasses);

        const saveResult = await model.save('localstorage://my-model-1')
        console.log(saveResult)
    } catch (error){
        alert(`error! ${error}`);
    }

}
function mapLabels(predictedLabels) {
    // Define an object that stores the mapping of values to classes
    const labelMap = {
        0: "Idle",
        1: "Gehen",
        2: "Kreis",
        3: "Schuetteln",
        4: "RechtsLinks",
        5: "ObenUnten",
        6: "Leviosa"
    };
    // Use the map() method to iterate over the predictedLabels array and apply the labelMap object to each element
    newLabels = []
    predictedLabels.forEach(predictedLabel => {
        switch (predictedLabel) {
            case 0:
                newLabels.push("idle");
                break;
            case 1:
                newLabels.push("Gehen");
                break;
            case 2:
                newLabels.push("Kreis");
                break;
            case 3:
                newLabels.push("Schuetteln");
                break;
            case 4:
                newLabels.push("RechtsLinks");
                break;
            case 5:
                newLabels.push("ObenUnten");
                break;
            case 6:
                newLabels.push("Leviosa");
                break;
            default:
                console.log("no match :/")
        }
    })
    //const mappedLabels = predictedLabels.map((label) => labelMap[label]);
    // Return the new array of mapped labels
    return newLabels;
}

async function loadModel() {
    // Get the checkbox element
    let checkbox = document.getElementById("load-model");
    // Get the status element
    let status = document.getElementById("status");
    // If the checkbox is checked
    if (true) {
        // Try to load the model from localstorage
        try {
            hostedTensorflowModel = await tf.loadLayersModel("localstorage://my-model-1");
            hostedTensorflowModel.summary();
            // Display a success message
            status.innerHTML = "Model loaded successfully!";
        } catch (error) {
            // Display an error message
            status.innerHTML = "Error loading model: " + error.message;
        }
    } else {
        // Clear the status message
        status.innerHTML = "";
    }
}