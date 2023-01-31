

document.addEventListener('DOMContentLoaded', function () {

	document.TimerSettings.timerDuration.addEventListener('change', CheckAuswahl);
 
	function CheckAuswahl () {
		var menu = document.TimerSettings.timerDuration;
    timerValue = menu.options[menu.selectedIndex].value;
    if (validTimerValue(timerValue)){
      recordButton.disabled = false;
    }
    var recordingButtonText = "";
    if(timerValue === '0'){
      recordingButtonText = "Sofort"
    } else{
      recordingButtonText = `nach ${timerValue} Sekunden`;
    }
		recordButton.innerHTML = `Starte Aufnahme: ${recordingButtonText}`;		
	}

});


function validTimerValue(timerValue){
  if(timerValue === undefined){
    return false;
  }
  return true;
}