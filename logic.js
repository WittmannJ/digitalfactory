

document.addEventListener('DOMContentLoaded', function () {

	document.TimerSettings.timerDuration.addEventListener('change', CheckAuswahl);
 
	function CheckAuswahl () {
		var menu = document.TimerSettings.timerDuration;
    timerValue = menu.options[menu.selectedIndex].value;

    
    var recordingButtonText = "";

    if (validTimerValue(timerValue)){
      recordButton.disabled = false;
      if(timerValue === '0'){
        recordingButtonText = "Sofort"
      } else{
        recordingButtonText = `nach ${timerValue} Sekunden`;
      }
      recordButton.innerHTML = `Starte Aufnahme: ${recordingButtonText}`;
    } else {
      recordButton.disabled = true;
      recordButton.innerHTML = `Bitte setze einen Timer`;
    }
    		
	}

});


function validTimerValue(timerValue){
  if(timerValue === undefined || !Number.isInteger(Number(timerValue))){
    return false;
  }
  return true;
}