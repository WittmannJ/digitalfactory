const ctx = document.getElementById("myChart");

var data = new Array(200).fill(0);

var labels = [];

data.forEach(x => {
  labels.push(' ');
})

var myChart = new Chart(ctx, {
  type: "line",
  data: {
    labels: labels,
    datasets: [
      {
        label: "power of acceleration in m/s^2",
        data: data,
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

function addData2(chart, label, data) {
    chart.data.labels.push(label);
    chart.data.datasets.forEach((dataset) => {
        dataset.data.push(data);
    });
    chart.update();
}

function addData(value){
  if(value === undefined){
    value = Math.random() * (19 - 5) + 9;
  }
  //var 
  //remove the oldest entry
  myChart.data.datasets[0].data.shift();
  myChart.data.labels.shift();
  
  myChart.data.datasets[0].data.push(value);
  myChart.data.labels.push(' ');
  myChart.update();
}
