if ('LinearAccelerationSensor' in window && 'Gyroscope' in window) {
    document.getElementById('moApi').innerHTML = 'Generic Sensor API';

    let lastReadingTimestamp;
    let accelerometer = new LinearAccelerationSensor({frequency: 50});
    accelerometer.addEventListener('reading', e => {
        if (lastReadingTimestamp) {
            intervalHandler(Math.round(accelerometer.timestamp - lastReadingTimestamp));
        }
        lastReadingTimestamp = accelerometer.timestamp
        accelerationHandler(accelerometer, 'moAccel');
    });
    accelerometer.start();



} else if ('DeviceMotionEvent' in window) {
    document.getElementById('moApi').innerHTML = 'Device Motion API';

    var onDeviceMotion = function (eventData) {
        //accelerationHandler(eventData.acceleration, 'moAccel');
        accelerationHandler(eventData.accelerationIncludingGravity, 'moAccelGrav');
        //rotationHandler(eventData.rotationRate);
        intervalHandler(eventData.interval);
    }

    window.addEventListener('devicemotion', onDeviceMotion, false);
} else {
    document.getElementById('moApi').innerHTML = 'No Accelerometer & Gyroscope API available';
}

function accelerationHandler(acceleration, targetId) {
    var info, xyz = "[X, Y, Z]";

    info = xyz.replace("X", acceleration.x && acceleration.x.toFixed(3));
    info = info.replace("Y", acceleration.y && acceleration.y.toFixed(3));
    info = info.replace("Z", acceleration.z && acceleration.z.toFixed(3));
    document.getElementById(targetId).innerHTML = info;
  
    var power = Math.sqrt((acceleration.x.toFixed(3))**2 + ( acceleration.y.toFixed(3))**2 + (acceleration.z.toFixed(3))**2);
    window.addData(power)
}

function rotationHandler(rotation) {
    var info, xyz = "[X, Y, Z]";

    info = xyz.replace("X", rotation.alpha && rotation.alpha.toFixed(3));
    info = info.replace("Y", rotation.beta && rotation.beta.toFixed(3));
    info = info.replace("Z", rotation.gamma && rotation.gamma.toFixed(3));
    document.getElementById("moRotation").innerHTML = info;
}

function intervalHandler(interval) {
    document.getElementById("moInterval").innerHTML = interval;
}