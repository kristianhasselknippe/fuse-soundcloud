var Observable = require("FuseJS/Observable");
var Playlist = require("Playlist");

function gotoNewsFeed(){
	router.goto("main",{},"newsFeedPage",{});
}
function gotoSearch(){
	router.goto("main",{},"searchPage",{});
}
function gotoFavorites(){
	router.goto("main",{},"favoritesPage",{});
}
function gotoComments(){
	router.push("comments");
}
function goBack(){
	router.goBack();
}

var isPlaying = Playlist.currentTrack.map(function(x){
	return x !== null;
});

var currentTrack = Playlist.currentTrack.map(function(x){
	return x;
});

function pushCurrentTrack(){
	router.push("track", { id: currentTrack.value.id });
}

module.exports = {
	goBack : goBack,

	gotoNewsFeed : gotoNewsFeed,
	gotoSearch : gotoSearch,
	gotoFavorites : gotoFavorites,
	gotoComments : gotoComments,
	isPlaying : isPlaying,
	currentTrack : currentTrack,
	pushCurrentTrack : pushCurrentTrack
};
