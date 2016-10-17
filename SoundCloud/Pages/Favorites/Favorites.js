var Observable = require("FuseJS/Observable");
var SoundCloud = require("SoundCloud");
var Login = require("Login");
var Playlist = require("Playlist");
var Model = require("SoundCloud/Model");

var asyncTracks;
var favoriteTracks = Login.isLoggedIn
		.map(function(x){
			asyncTracks = Observable();
			if (x === true){
				SoundCloud.fetchFavorites()
					.then(function(favorites){
						asyncTracks.replaceAll(favorites);
					});
			}
			return asyncTracks;
		})
		.inner();

function pushSongDetails(arg){
	Playlist.setCurrentPlaylist(favoriteTracks._values);
	Playlist.setCurrentTrackAndPlayIfDifferent(arg.data);
	router.push("track", { });
}

var isLoading = Observable(false);
function reloadHandler(){
	if (Login.isLoggedIn.value === true){
		isLoading.value = true;
		SoundCloud.fetchFavorites()
			.then(function(favorites){
				asyncTracks.replaceAll(favorites);
				isLoading.value = false;
			});
	} else {
		isLoading.value = false;
	}
}

function unlikeTrack(arg){
	Model.PostUnlikeTrack(arg.data.id)
		.then(function(t){
			favoriteTracks.removeWhere(function(item){
				return item.id === arg.data.id;
			});
			console.log("Done unliking track");
		}).catch(function(err){
			console.log("Problems unliking track: " + JSON.stringify(err));
		});

}
function loginLogoutClicked(){
	if (!Login.isLoggedIn.value) {
		Login.login();
	} else {
		Login.logout();
	}
}
module.exports = {
	favoriteTracks : favoriteTracks,
	pushSongDetails : pushSongDetails,
	reloadHandler : reloadHandler,
	isLoading : isLoading,
	loginLogoutClicked : loginLogoutClicked,
	unlikeTrack : unlikeTrack,
	isLoggedIn : Login.isLoggedIn,
	me : Login.me
};
