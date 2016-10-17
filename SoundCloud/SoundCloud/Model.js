var Observable = require("FuseJS/Observable");
var SoundCloud = require("SoundCloud");
var SoundCloudModel = require("SoundCloud/SoundCloudModel");

function ModelCache(fetcherPromise){
	var cache = {};
	this.getItem = function(id){
		var ret = Observable();
		if (id in cache) {
			return cache[id];
		} else {
			fetcherPromise(id).then(function(results){
				if (results instanceof Array) {
					ret.replaceAll(results);
				} else {
					ret.value = results;
				}
			});
			cache[id] = ret;
		}
		return ret;
	};
	this.invalidateItem = function(id) {
		console.log("invalidating : " + id);
		delete cache[id];
	};
}

function Invalidate(cache, item) {
	
}

function DelayedObservable(getter){
	var ret = Observable();
	getter(ret);
	return ret;
}

var GetTracksForSearchTerm = function(term){
	return DelayedObservable(function(obs){
		SoundCloud.fetchTracksForSearchTerm(term)
			.then(function(results){
				obs.replaceAll(results);
			});
	});
};

var trackCache;
var GetTrackInfo = function(){
	trackCache = new ModelCache(SoundCloud.fetchTrackInfoForTrackId);
	return function(id){ return trackCache.getItem(id); };
}();

function PostLikeTrack(trackId){
	trackCache.invalidateItem(trackId);
	return SoundCloud.likeTrack(trackId); //should some more stuff be done here?
}

function PostUnlikeTrack(trackId){
	trackCache.invalidateItem(trackId);
	return SoundCloud.unlikeTrack(trackId); //should some more stuff be done here?
}

var GetTracksForUserId = function(){
	var cache = new ModelCache(SoundCloud.fetchTracksForUserId);
	return function(id){ return cache.getItem(id); };
}();


var GetUser = function(){
	var cache = new ModelCache(SoundCloud.fetchInfoForUserId);
	return function(id){ return cache.getItem(id); };
}();

var commentsCache;
var GetTrackComments = function(){
	commentsCache = new ModelCache(SoundCloud.fetchCommentsForTrackId);
	return function(id){ return commentsCache.getItem(id); };
}();

function InvalidateCommentsForTrack(trackId){
	commentsCache.invalidateItem(trackId);
}

function PostNewComment(trackId,body){
	return SoundCloud.postNewComment(trackId,body)
		.then(function(x){
			console.log("XX: " + JSON.stringify(x));
			return SoundCloudModel.CreateComment(x);
		});
}

function GetMe(){
	return DelayedObservable(function(obs){
		SoundCloud.fetchMe()
			.then(function(me){
				obs.value = me;
			});
	});
}

function GetIsFollowingUser(userId){
	return DelayedObservable(function(obs){
		console.log("Following?: " + JSON.stringify(userId));
		SoundCloud.isFollowingUser(userId)
			.then(function(result){
				console.log("following result: " + JSON.stringify(result));
				obs.value = result;
			}).catch(function(err){
				console.log("Error following : " + err);
			});
	});
}

function PostFollowUser(userId){
	return SoundCloud.followUser(userId); //should some more stuff be done here?
}

function PostUnfollowUser(userId){
	return SoundCloud.unfollowUser(userId); //should some more stuff be done here?
}

function GetIsLikingTrack(trackId){
	return DelayedObservable(function(obs){
		SoundCloud.isLikingTrack(trackId)
			.then(function(result){
				obs.add(result);
			});
	});
}

function GetFavorites(){
	return DelayedObservable(function(obs){
		SoundCloud.fetchFavorites()
			.then(function(favorites){
				obs.replaceAll(favorites);
			});
	});
}

module.exports = {
	GetTracksForUserId,
	GetTracksForSearchTerm,
	GetTrackInfo,
	GetUser,
	GetTrackComments,
	InvalidateCommentsForTrack,
	PostNewComment,
	GetMe,
	GetIsFollowingUser,
	PostFollowUser,
	PostUnfollowUser,
	GetIsLikingTrack,
	PostLikeTrack,
	PostUnlikeTrack,
	GetFavorites
};
