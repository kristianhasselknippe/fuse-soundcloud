var Observable = require('FuseJS/Observable');
var Playlist = require("Playlist");
var PLAYING_STATE = require("PlayingState");

var isNotStoppedOrError = Playlist.playingState.map(function(x){
	var ret = x !== PLAYING_STATE.STOPPED && x !== PLAYING_STATE.ERROR;
	return ret;
});

function pushCurrentTrack(){
	if (Playlist.currentTrack.value !== null){
		router.push("track", { });
	}
}

function pauseResume(){
	if (Playlist.playingState.value === PLAYING_STATE.PLAYING)
		Playlist.pause();
	else if (Playlist.playingState.value === PLAYING_STATE.PAUSED)
		Playlist.resume();
}

module.exports = {
	isNotStoppedOrError : isNotStoppedOrError,
	isPaused : Playlist.isPaused,
	isPlaying : Playlist.isPlaying,
	isLoading : Playlist.isLoading,
	pauseResume : pauseResume,
	pushCurrentTrack : pushCurrentTrack,
	currentTrack : Playlist.currentTrack
};
