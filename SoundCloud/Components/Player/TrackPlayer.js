var Observable = require('FuseJS/Observable');

var Timer = require('FuseJS/Timer');
var Moment = require('moment');
var Playlist = require("Playlist");

//todo: this should perhaps live somewhere else?
function formatDuration(dur){
	var min = dur.minutes() + ":";
	if (dur.minutes() < 10)
		min = "0" + min;
	var sec = dur.seconds() + "";
	if (dur.seconds() < 10)
		sec = "0" + sec;
	var ret = min + sec;
	if (dur.hours() > 0)
		ret = dur.hours() + ":" + ret;
	return ret;
}

var durationView = Playlist.duration.map(function(x){
	return formatDuration(Moment.duration(Math.floor(x), 'seconds'));
});

var progressView = Playlist.progress.map(function(x){
	return formatDuration(Moment.duration(Math.floor(x), 'seconds'));
});

module.exports = {
	duration : durationView,
	progress : progressView
};
