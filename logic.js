document.addEventListener('DOMContentLoaded', function () {

	document.TimerSettings.timerDuration.addEventListener('change', CheckAuswahl);
 
	function CheckAuswahl () {
		var menu = document.TimerSettings.timerDuration;
    var timerValue = menu.options[menu.selectedIndex].value;
    var recordingButtonText = "";
    if(timerValue === '0'){
      recordingButtonText = "Sofort"
    } else{
      recordingButtonText = `nach ${timerValue} Sekunden`;
    }
		document.getElementById('recordButton').innerHTML = `Starte Aufnahme: ${recordingButtonText}`;		
	}

});