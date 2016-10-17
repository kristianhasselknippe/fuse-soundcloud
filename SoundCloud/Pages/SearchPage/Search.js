var Moment = require("moment");
var Model = require("SoundCloud/Model");
var Observable = require("FuseJS/Observable");
var Playlist = require("Playlist");

var searchTerm = Observable("yupferris");
var searchTermView = Observable("yupferris");

var trackList = searchTerm.map(Model.GetTracksForSearchTerm).inner();

function performSearch() {
	if (searchTermView.value.length > 0) {
		searchTerm.value = searchTermView.value;
	}
}

function abortSearch() {
	trackList.clear();
	searchTermView.value = "";
}

function pushSongDetails(arg){
	Playlist.setCurrentPlaylist(trackList._values);
	Playlist.setCurrentTrackAndPlayIfDifferent(arg.data);
	router.push("track", {});
}

module.exports = {
	searchTerm: searchTermView,
	trackList: trackList,
	pushSongDetails: pushSongDetails,
	performSearch: performSearch,
	abortSearch: abortSearch
};
