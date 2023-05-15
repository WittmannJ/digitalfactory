
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


async function processFiles() {
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

                    // Extract suitable features (you need to implement this part)
                    const features = extractFeatures(recording);

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

async function trainModel(recordings) {
    const xs = tf.tensor2d(recordings.map(r => r.features));
    const labels = recordings.map(r => r.label);

    // Convert labels to one-hot encoded vectors
    const uniqueLabels = Array.from(new Set(labels));
    const ys = tf.tensor2d(
        labels.map(label => uniqueLabels.map(ul => ul === label ? 1 : 0))
    );

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
            console.log(`Epoch ${epoch + 1}: ${elapsedTime.toFixed(2)}s - loss: ${loss.toFixed(4)}`);
            alert(`Epoch ${epoch + 1}: ${elapsedTime.toFixed(2)}s - loss: ${loss.toFixed(4)}`);
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
    alert('Accuracy: ' + accuracy);

    // Make predictions with the trained model
    const predictions = model.predict(xs);
    predictions.print();
    console.log(predictions);
    const predictedLabels = tf.argMax(predictions, axis = 1).dataSync();

    // Convert predicted labels to their corresponding class names
    //const predictedClasses = predictedLabels.map(labelIndex => uniqueLabels[labelIndex]);
    const predictedClasses = mapLabels(predictedLabels);

    // Print the predicted classes
    console.log(predictedClasses);
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