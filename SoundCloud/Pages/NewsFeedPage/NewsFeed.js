var SoundCloud = require("SoundCloud");
var Observable = require('FuseJS/Observable');
var Login = require("Login");
var Playlist = require("Playlist");

var activities = Observable();

var next_href;
function fetchActivities(){
	return SoundCloud.fetchActivities()
		.then(function(ac){
			activities.replaceAll(ac.collection);
			next_href = ac.next_href;
		});
}


Login.isLoggedIn.addSubscriber(function(x){
	if (x.value) {
		fetchActivities();
	} else {
		activities.clear();
	}
});

function fetchMore(){
	if (next_href && next_href !== ""){
		SoundCloud.fetchNextActivities(next_href)
			.then(function(ac){
				ac.collection.forEach(function(a){
					activities.add(a);
				});
				next_href = ac.next_href;
			});
	}
}

function pushSongDetails(arg){
	var newsFeedTracks = [];
	activities.forEach(function(x){
		if (x.type === "track" || x.type === "track-repost")
			newsFeedTracks.push(x.origin);
	});
	Playlist.setCurrentPlaylist(newsFeedTracks);
	Playlist.setCurrentTrackAndPlayIfDifferent(arg.data.origin);
	router.push("track", { });
}

var isLoading = Observable(false);
function reloadHandler(){
	if (Login.isLoggedIn.value === true){
		isLoading.value = true;
		fetchActivities()
			.then(function(x){
				isLoading.value = false;
			});

	} else {
		isLoading.value = false;
	}
}
function loginLogoutClicked(){
	if (!Login.isLoggedIn.value)
		Login.login();
	else
		Login.logout();
}

module.exports = {
	activities : activities,
	fetchMore : fetchMore,
	isLoggedIn : Login.isLoggedIn,
	pushSongDetails : pushSongDetails,
	loginLogoutClicked : loginLogoutClicked,
	reloadHandler : reloadHandler,
	isLoading : isLoading
};
