var chart;

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
  
  if(numberOfPointsSinceLastUpdate >= updateChartAfterHowManyDatapoints){
    numberOfPointsSinceLastUpdate = 0;
    myChart.update();
  }*/

    chart.update();
  }

  function sayHi() {
    console.log("worker says hi!");
  }
}
