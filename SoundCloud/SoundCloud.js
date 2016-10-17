var baseUrl = "http://api.soundcloud.com/";
var Auth = require("Auth");
var SoundCloudModel = require("SoundCloud/SoundCloudModel");

function getAccessToken(){
	return Auth.getAccessToken();
}

function SoundCloud(api, args, m, body, baseUrl_){
	var b = baseUrl;
	var isFullBase = false;
	if (baseUrl_){
		isFullBase = true;
		b = baseUrl_;
	}

	var url = b + api
			+ (isFullBase ? "&" : "?")
			+ "client_id=" + Auth.clientId;
	if (getAccessToken() !== null){
		url = url + "&" + "oauth_token=" + getAccessToken().token;
	}
	for (var k in args){
		url = url + "&" + k + "=" + encodeURI(args[k]);
	}

	console.log("URL: " + url);

	var requestData = {
		method : m
	};
	if (body !== null){
		requestData.headers = {
			'Content-Type': 'application/json'
		};
		requestData.body = JSON.stringify(body);
	}

	return fetch(url,requestData).then(function(res) {
		if (res.status === 200 || res.status === 201 || res.status === 303){
			return res.json();
		}else if (res.status === 400){//400 Bad request
			console.log("We made a bad request");
		}else if (res.status === 401){//401 Unauthorized
			//console.log("The request did not pass along the required authorization tokens");
		}else if (res.status == 403){//403 Forbidden
			console.log("We do not have access to the requested resource");
		}else if (res.status === 404){//404 Not Found: assume that the request knows what this means (for followings this means false)
			return null;
		}else if (res.status === 422){//422 something wrong with the contents of the request
			console.log("The request have some missing or wrong data");
		}else if (res.status == 429){//429 Too Many Requests
			console.log("We are making too many requests");
		}
		console.log(JSON.stringify(res));
		return null;
	}).catch(function(msg) {
		console.log("Failed to fetch " + msg);
	});
}

function SoundCloudGet(api,args){
	return SoundCloud(api,args,"get",null)
		.catch(function(msg){
			console.log("Failed to soundcloudget : " + JSON.stringify(msg));
		});
}

function SoundCloudPut(api,args){
	return SoundCloud(api,args,"put",null)
		.catch(function(msg){
			console.log("Failed to soundcloudput : " + msg);
		});
}

function SoundCloudPost(api,args,body){
	return SoundCloud(api,args,"post",body)
		.catch(function(msg){
			console.log("Failed to soundcloudpost : " + msg);
		});
}

function SoundCloudDelete(api,args){
	return SoundCloud(api,args,"delete",null)
		.catch(function(msg){
			console.log("Failed to soundclouddelete : " + msg);
		});
}

function fetchTracksForUserId(userId){
	return SoundCloudGet("users/" + userId + "/tracks", {})
		.then(function(tracks){
			var ret = [];
			tracks.forEach(function(t){
				ret.push(SoundCloudModel.CreateTrack(t));
			});
			return ret;
		});
}

function fetchTracksForSearchTerm(term){
	return SoundCloudGet("tracks", { q: term }).then(function(result){
		return SoundCloudModel.CreateTracks(result);
	});
}

function fetchTrackInfoForTrackId(trackId){
	return SoundCloudGet("tracks/" + trackId,{}).
		then(function(trackInfo){
			console.log("Got track info: " + trackId + ": " + JSON.stringify(trackInfo));
			return SoundCloudModel.CreateTrack(trackInfo);
		});
}

function fetchInfoForUserId(userId){
	return SoundCloudGet("users/" + userId, {})
		.then(function(userInfo){
			return SoundCloudModel.CreateUser(userInfo);
		});
}

function fetchCommentsForTrackId(trackId){
	return SoundCloudGet("tracks/" + trackId + "/comments",{})
		.then(function(comments){
			var ret = [];
			comments.forEach(function(c){
				ret.push(SoundCloudModel.CreateComment(c));
			});
			return ret;
		});
}

function postNewComment(trackId,body){
	return SoundCloudPost("tracks/" + trackId + "/comments", {}, body);
}

function fetchMe(){
	return SoundCloudGet("me", {})
		.then(function(me){
			return SoundCloudModel.CreateUser(me);
		});
}

function fetchActivities(){
	return SoundCloudGet("me/activities", {})
		.then(function(activities){
			return SoundCloudModel.CreateActivityCollection(activities);
		}).catch(function(err){
			console.log("error fetching activities: " + err);
		});
}

function fetchNextActivities(next_href){
	return SoundCloud("",{},"get",null,next_href)
		.then(function(activities){
			return SoundCloudModel.CreateActivityCollection(activities);
		});
}

function isFollowingUser(userId){
	console.log("We are getting following for : " + userId);
	return SoundCloudGet("me/followings/" + userId, {})
		.then(function(following){
			console.log("Following: " + JSON.stringify(following));
			if (following === null)
				return false;
			return true;
		});
}

function followUser(userId){
	return SoundCloudPut("me/followings/" + userId, {});
}

function unfollowUser(userId){
	return SoundCloudDelete("me/followings/" + userId, {});
}

function isLikingTrack(trackId){
	return SoundCloudGet("me/favorites/" + trackId, {});
}

function likeTrack(trackId){
	return SoundCloudPut("me/favorites/" + trackId, {});
}

function unlikeTrack(trackId){
	return SoundCloudDelete("me/favorites/" + trackId, {});
}

function fetchFavorites(){
	return SoundCloudGet("me/favorites", {})
		.then(function(favorites){
			return SoundCloudModel.CreateTracks(favorites);
		}).catch(function(err){
			console.log("Error fetching favorites: " + JSON.stringify(err));
		});
}

module.exports = {

	fetchTracksForSearchTerm : fetchTracksForSearchTerm,
	fetchTracksForUserId : fetchTracksForUserId,
	fetchTrackInfoForTrackId: fetchTrackInfoForTrackId,
	fetchInfoForUserId : fetchInfoForUserId,
	fetchCommentsForTrackId : fetchCommentsForTrackId,

	isFollowingUser : isFollowingUser,
	followUser : followUser,
	unfollowUser : unfollowUser,

	isLikingTrack : isLikingTrack,
	likeTrack : likeTrack,
	unlikeTrack : unlikeTrack,

	fetchMe : fetchMe,

	postNewComment : postNewComment,

	fetchActivities : fetchActivities,
	fetchNextActivities : fetchNextActivities,

	fetchFavorites : fetchFavorites
};
