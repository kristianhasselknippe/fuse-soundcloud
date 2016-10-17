var Observable = require('FuseJS/Observable');
var Playlist = require("Playlist");

var isInteracting = false;
var sliderValue = Observable(0.0);

Playlist.progress.addSubscriber(function(x){
	if (isInteracting)
		return;
	var ret = x.value / Playlist.duration.value;
	sliderValue.value = ret;
});

function interacting(){
	isInteracting = true;
}

function seekToSliderValue(){
	if (sliderValue.value) {
		Playlist.seek(sliderValue.value);
	}
	isInteracting = false;
}

module.exports = {
	seekToSliderValue : seekToSliderValue,
	interacting : interacting,
	isInteracting : isInteracting,
	sliderValue : sliderValue

};
