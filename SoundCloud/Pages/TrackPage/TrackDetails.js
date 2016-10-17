var Moment = require("moment");
var SoundCloud = require("SoundCloud");
var Observable = require("FuseJS/Observable");
var Login = require("Login");
var Playlist = require("Playlist");

var Model = require("SoundCloud/Model");

var currentTrackUser = Playlist.currentTrack
		.notNull()
		.map(function(track) {
			console.log("Track in currenttrackuser: " + JSON.stringify(track));
			if (track && track.user) {
				return Model.GetUser(track.user.id);
			} else {
				return Observable();
			}
		}).inner();

var favoritedCurrentTrack = Playlist.currentTrack.map(function(track) {
	return track.user_favorite;
});

var favoritedCurrentTrackIcon = favoritedCurrentTrack.map(function(x) {
	return x ? 0 : 1;
});

var followingCurrentTrack = Playlist.currentTrack
		.notNull()
		.map(function(x){ return x.user.id; })
		.map(Model.GetIsFollowingUser)
		.inner();

followingCurrentTrack.onValueChanged(function(x){
	console.log("Following: " + JSON.stringify(x));
});

var followingCurrentTrackText = followingCurrentTrack.map(function(x) {
	return x ? "UNFOLLOW" : "FOLLOW";
});

var allComments = Playlist.currentTrackId.map(Model.GetTrackComments).inner();
var nCommentsPerPage = 8;
var nCommentsShowing = 0;

var comments = Observable();

Playlist.currentTrackId.onValueChanged(function(x){
	comments.clear();
	nCommentsShowing = 0;
});

function showMoreComments() {
	console.log("Show more comments");
	console.log("All comments: " + JSON.stringify(allComments));
	if (nCommentsShowing < allComments.length){
		nCommentsShowing += nCommentsPerPage;
		while (comments.length < nCommentsShowing && comments.length < allComments.length - 1){
			comments.add(allComments.getAt(comments.length));
		}
	}
}

allComments.addSubscriber(function(){
	if (nCommentsShowing === 0) {
		showMoreComments();
	}
});

function pushUser(arg) {
	var user = arg.data.value;
	if (user === undefined)
		user = arg.data;
	router.push("user", {id:user.user_id});
}

function goBack() {
	router.goBack();
}

function followUnfollow() {
	if (!followingCurrentTrack.value){
		SoundCloud.followUser(Playlist.currentTrack.value.user.id)
			.then(function(x){ console.log("Done following user: " + Playlist.currentTrack.value.user.id); })
			.catch(function(e){
				console.log("Error following : " + e);
				followingCurrentTrack.value = false;
			});
	} else {
		followingCurrentTrack.value = false;
		console.log("Unfollwing : " + Playlist.currentTrack.value.user.id);
		SoundCloud.unfollowUser(Playlist.currentTrack.value.user.id)
			.then(function(x){ console.log("Done unfollowing user: " + Playlist.currentTrack.value.user.id); })
			.catch(function(e){
				console.log("Error unfollowing : " + e);
				followingCurrentTrack.value = true;
			});
	}
	followingCurrentTrack.value = !followingCurrentTrack.value;
}

function likeUnlike(){
	if (!favoritedCurrentTrack.value){
		Model.PostLikeTrack(Playlist.currentTrackId.value)
			.then(function(x){ console.log("Done liking track " + Playlist.currentTrackId.value); })
			.catch(function(e){p
				console.log("Error liking : " + e);
				favoritedCurrentTrack.value = false;
			});
	} else {
		Model.PostUnlikeTrack(Playlist.currentTrackId.value)
			.then(function(x){ console.log("Done unliking track " + Playlist.currentTrackId.value); })
			.catch(function(e){
				console.log("Error unliking : " + e);
				favoritedCurrentTrack.value = true;
			});
	}
	favoritedCurrentTrack.value = !favoritedCurrentTrack.value;
}

var newCommentBody = Observable("");
function addNewComment(){
	if (newCommentBody.value.length === 0)
		return;
	var comment = {comment : {body : newCommentBody.value}};
	newCommentBody.value = "";
	var trackId = Playlist.currentTrack.value.id;
	Model.PostNewComment(trackId, comment)
		.then(function(x){
			comments.insertAt(0,x);
			Model.InvalidateCommentsForTrack(trackId);
		}).catch(function(err){
			console.log("Error commenting: " + JSON.stringify(err));
		});
}



module.exports = {
	currentTrack: Playlist.currentTrack,
	currentTrackUser : currentTrackUser,
	comments: comments,
	pushUser: pushUser,
	goBack: goBack,

	favoritedCurrentTrack : favoritedCurrentTrack,
	favoritedCurrentTrackIcon : favoritedCurrentTrackIcon,

	followingCurrentTrack : followingCurrentTrack,
	followingCurrentTrackText : followingCurrentTrackText,

	isLoggedIn : Login.isLoggedIn,
	me : Login.me,


	likeUnlike : likeUnlike,
	followUnfollow : followUnfollow,

	newCommentBody : newCommentBody,
	addNewComment : addNewComment,

	hasPrevious : Playlist.hasPrevious,
	hasNext : Playlist.hasNext,
	
	showMoreComments : showMoreComments
};
