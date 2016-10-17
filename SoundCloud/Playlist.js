var Observable = require("FuseJS/Observable");
var PlaylistPlayer = require("PlaylistPlayer");
var Auth = require("Auth");
var PLAYING_STATE = require("PlayingState");
var Timer = require("FuseJS/Timer");
var Model = require("SoundCloud/Model");


var playingState = Observable(PLAYING_STATE.STOPPED);
PlaylistPlayer.statusChanged = function(status){
	playingState.value = PLAYING_STATE.parse(status);
};

var currentTrackId = Observable();
var currentTrack = currentTrackId.map(Model.GetTrackInfo).inner();


currentTrack.onValueChanged(function(val){
	console.log("TrackChanged: " + JSON.stringify(val));
});


var currentPlaylist = [];

var duration = Observable(0.0);
var progress = Observable(0.0);

var timer = null;
function deleteTimer(){
	if (timer !== null)
		Timer.delete(timer);
}

function createNewTimer(){
	deleteTimer();
	timer = Timer.create(function(){
		duration.value = PlaylistPlayer.duration;
		progress.value = PlaylistPlayer.progress;
	}, 100, true);
}

playingState.addSubscriber(function() {
	if (playingState.value === PLAYING_STATE.PLAYING) {
		createNewTimer();
	} else {
		deleteTimer();
	}
});

function setCurrentTrackToUnoTrackId(unoTrackId){
	var jsTrack =  currentPlaylist.filter(function(x){
		return x.id === unoTrackId;
	});
	if (jsTrack.length > 0)
		currentTrackId.value = jsTrack[0].id;
}

PlaylistPlayer.currentTrackChanged = function(){
	var newCurrentTrack = PlaylistPlayer.currentTrack;
	if (newCurrentTrack)
		currentTrackId.value = newCurrentTrack.id;
};

function playNext(){ setCurrentTrackToUnoTrackId(PlaylistPlayer.next()); }

function playPrevious(){ setCurrentTrackToUnoTrackId(PlaylistPlayer.previous()); }

function trackToUnoTrack(track){
	return {
		id : track.id,
		name : track.title,
		artist : track.artist,
		url : track.stream_url + "?client_id=" + Auth.clientId,
		artworkUrl : track.artwork_500 + "?client_id=" + Auth.clientId,
		duration : track.duration / 1000.0
	};
}

function setCurrentPlaylist(pl){
	currentPlaylist = [];
	var trackList = [];
	pl.forEach(function(x){
		currentPlaylist.push(x);
		trackList.push(trackToUnoTrack(x));
	});
	PlaylistPlayer.setPlaylist(trackList);
}

var isPlaying = playingState.map(function(x){ return x === PLAYING_STATE.PLAYING; });
var isPaused = playingState.map(function(x){ return x === PLAYING_STATE.PAUSED; });
var isStopped = playingState.map(function(x){ return x === PLAYING_STATE.STOPPED; });
var isLoading = playingState.map(function(x){ return x === PLAYING_STATE.LOADING; });

var hasPrevious = Observable(false);
var hasNext = Observable(false);

PlaylistPlayer.hasNextChanged = function(n){
	hasNext.value = n;
};

PlaylistPlayer.hasPreviousChanged = function(p){
	hasPrevious.value = p;
};

function seek(progress){
	PlaylistPlayer.seek(progress);
}

function resume(){
	PlaylistPlayer.resume();
}

function pause(){
	PlaylistPlayer.pause();
}

function play(t){
	if (t){
		PlaylistPlayer.play(t);
		isLoading.value = true; // so we don't have to wait for the round trip
	}
}

function stop(){
	PlaylistPlayer.stop();
}

function setCurrentTrackAndPlayIfDifferent(track){
	var t = trackToUnoTrack(track);
	console.log("SetCurrent: " + JSON.stringify(currentTrack));
	var currentId = currentTrackId.value ? currentTrack.value.id : false;
	if (t.id !== currentId){
		play(t);
		currentTrackId.value = track.id;
	}
}

module.exports = {
	setCurrentPlaylist : setCurrentPlaylist,
	setCurrentTrackAndPlayIfDifferent : setCurrentTrackAndPlayIfDifferent,

	currentTrack : currentTrack,
	currentTrackId : currentTrackId,

	hasPrevious : hasPrevious,
	hasNext : hasNext,

	playingState : playingState,

	resume : resume,
	playNext : playNext,
	playPrevious : playPrevious,
	pause : pause,
	stop : stop,
	seek : seek,
	play : play,

	isPlaying : isPlaying,
	isPaused : isPaused,
	isStopped : isStopped,
	isLoading : isLoading,
	
	duration : duration,
	progress : progress


};
