var SoundCloud = require("SoundCloud");
var Observable = require("FuseJS/Observable");
var Playlist = require("Playlist");

var currentUserId = Observable();

var user = currentUserId.map(function(userId){
	var ret = Observable();
	SoundCloud.fetchInfoForUserId(userId)
		.then(function(userInfo){
			ret.value = userInfo;
		});
	return ret;
}).inner();

var tracks = currentUserId.map(function(userId){
	var ret = Observable();
	SoundCloud.fetchTracksForUserId(userId)
		.then(function(tracks){
			ret.replaceAll(tracks);
		});
	return ret;
}).inner();

function pushSongDetails(arg){
	Playlist.setCurrentPlaylist(tracks._values);
	Playlist.setCurrentTrackAndPlayIfDifferent(arg.data);
	router.push("track", { });
}

this.onParameterChanged(function(user){
	currentUserId.value = user.id;
});

module.exports = {
	user : user,
	tracks : tracks,
	pushSongDetails : pushSongDetails
};
