var chart;

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

if ("function" === typeof importScripts) {
  importScripts('chart.min.js');

  this.addEventListener("message", onMessage);

  function onMessage_original(event) {
    if (!("ctx" in event.data)) {
      addDataXYZ(event.data[0], event.data[1], event.data[2]);
    } else {
      const ctx = event.data.ctx;
      const myChartConfig = event.data.myChartConfig;
      //const { ctx, myChartConfig } = event.data;
      chart = new Chart(ctx, myChartConfig);

      // Resizing the chart must be done manually, since OffscreenCanvas does not include event listeners.
      ctx.width = event.data.width;
      ctx.height = event.data.height * 0.5;
      chart.resize();
    }

    function addData(chart, label, data) {
      chart.data.labels.push(label);
      chart.data.datasets.forEach((dataset) => {
        dataset.data.push(data);
      });
      chart.update();
    }
  }

  function onMessage(event) {
    const ctx = event.data.ctx;
    const myChartConfig = event.data.myChartConfig;
    //const { ctx, myChartConfig } = event.data;
    chart = new Chart(ctx, myChartConfig);

    // Resizing the chart must be done manually, since OffscreenCanvas does not include event listeners.
    ctx.width = event.data.width;
    ctx.height = event.data.height * 0.5;
    chart.resize();
    this.removeEventListener("message", onMessage);
    this.addEventListener("message", onMessage2);
  }

  function addData(chart, label, data) {
    chart.data.labels.push(label);
    chart.data.datasets.forEach((dataset) => {
      dataset.data.push(data);
    });
    chart.update();
  }

  function onMessage2(event) {
    addDataXYZ(event.data[0], event.data[1], event.data[2]);
  }

  function addDataXYZ(x, y, z) {
    chart.data.datasets[0].data.shift();
    chart.data.datasets[1].data.shift();
    chart.data.datasets[2].data.shift();
    chart.data.labels.shift();

    chart.data.datasets[0].data.push(x);
    chart.data.datasets[1].data.push(y);
    chart.data.datasets[2].data.push(z);
    chart.data.labels.push(" ");

    

    
    /*numberOfPointsSinceLastUpdate++;

    c
  
  if(numberOfPointsSinceLastUpdate >= updateChartAfterHowManyDatapoints){
    numberOfPointsSinceLastUpdate = 0;
    myChart.update();
  }*/
    // try{

    //   Newchart = lowPassFilterChart(chart);
    //   alert("successful filtering!");
    // } catch (error){
    //   alert("error during filtering!");
    // }

    chart.update();
  }

  function lowPassFilterChart(chart) {
    // Set the smoothing factor for the filter
    LPF.smoothing = 0.5;
  
    // Loop through each dataset
    for (let i = 0; i < 3; i++) {
      // Get the values array from the dataset
      let values = chart.data.datasets[i].data;
  
      // Apply the filter on the values array
      let filteredValues = LPF.smoothArray(values);
  
      // Replace the values array with the filtered one
      chart.data.datasets[i].data = filteredValues;
    }
  
    // Return the chart object
    return chart;
  }
  

  function sayHi() {
    console.log("worker says hi!");
  }
}
