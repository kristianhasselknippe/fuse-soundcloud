var Observable = require("FuseJS/Observable"); 
var InterApp = require("FuseJS/InterApp");
var Storage = require("FuseJS/Storage");
var Config = require("SoundCloudConfig");

var clientId = Config.clientId;
var clientSecret = Config.clientSecret;

var isLoggedIn = Observable(false);
var isLoggingOut = false;
var getAccessToken = function() {
	var accessToken = null;
	var isRefreshing = false;
	var __f = function(callback){
		if (isLoggingOut) {
			accessToken = null;
			isLoggingOut = false;
		}
		
		if (accessToken === null) {
			var t = getAccessTokenFromStorage();
			if (t !== null) {
				accessToken = t;
			}
		}
		if (accessToken !== null){
			if (hasAccessTokenExpired(accessToken)){
				if (!isRefreshing) {
					isRefreshing = true;
					refreshToken(accessToken.refresh_token, function(newToken){
						console.log("Done refreshing accessToken: " + JSON.stringify(newToken));
						saveAccessTokenToStorage(newToken);
						isRefreshing = false;
						accessToken = newToken;
						if (callback) {
							callback(accessToken);
						}
					},function(){
						isRefreshing = false;
					});
				}
			}
		}
		if (accessToken !== null && callback)  {
			callback(accessToken);
		}
		return accessToken;
	};

	accessToken = __f();
	return __f;
}();

function hasAccessTokenExpired(t){
	var errorMargin = 0;//500000;// 500000 just to have a slight margin of error between token creation and when it was saved
	var now = Date.now();
	var ret = now > ((t.expires_in * 1000) + t.created) - errorMargin;
	return ret;
}

//TODO: Gotta make sure this is robust and doesn't do a ton of unnesessary work
function AccessToken(token, expires_in, scope, refresh_token){
	this.token = token;
	this.expires_in = 6; //expires_in; //n seconds until expiration
	this.scope = scope;
	this.refresh_token = refresh_token;
	this.created = Date.now(); //in millis since the unix epoch
}

function requestCode(){
	var uri = "https://soundcloud.com/connect?client_id=" + clientId
			+ "&display=popup"
			+ "&response_type=code"
			+ "&redirect_uri=fuse-soundcloud://fuse";
	InterApp.launchUri(uri);
}

var filename = "accessToken";
function getAccessTokenFromStorage(){
	console.log("Trying to get access token from storage");
	var c = Storage.readSync(filename);
	if (c !== null && c !== ""){
		var t = JSON.parse(c);
		if (t.token !== undefined){
			console.log("Did get access token from storage");
			return t;
		}
	}
	console.log("Failed to get access token from storage");
	return null;
}

function saveAccessTokenToStorage(token){
	Storage.deleteSync(filename);
	if (Storage.writeSync(filename, JSON.stringify(token))) {
		console.log("Successfully saved access token: " + token);
		console.log(JSON.stringify(token));
		if (isLoggedIn.value != true) {
			isLoggedIn.value = true;
		}
	} else {
		console.log("Could not save acccess token: " + token);
	}
}

function deleteAccessTokenFromStorage(){
	Storage.write(filename, "")
		.catch(function(err){
			console.log("Failed to delete token from storage: " + JSON.stringify(err));
		});
}


function requestAccessToken(code){
	var uri = "https://api.soundcloud.com/oauth2/token";

	console.log(uri);

	var body =  "client_id=" + clientId
			+ "&client_secret=80673cb888c9215256d17c99a7310859"
			+ "&redirect_uri=fuse-soundcloud://fuse"
			+ "&grant_type=authorization_code"
			+ "&scope=non-expiring"
			+ "&code=" + code.split("#")[0];

	fetch(uri, {
		method: "POST",
		headers: {
			"Accept": "application/json",
			"Content-type": "application/x-www-form-urlencoded; charset=UTF-8"
		},
		body: body
	}).then(function(response){
		return response.json();
	}).then(function(responseObject){
		console.log("Access token:");
		console.log(responseObject);
		var at = new AccessToken(
			responseObject.access_token,
			responseObject.expires_in,
			responseObject.scope,
			responseObject.refresh_token
		);
		saveAccessTokenToStorage(at);
	}).catch(function(err){
		console.log("Error in Login.js: requestAccessToken");
		console.log(err.message);
	});
}

function refreshToken(refresh_token, callback, error) {
	var uri = "https://api.soundcloud.com/oauth2/token";

	console.log("Refreshing access token:");
	console.log(uri);

	var body =  "client_id=" + clientId
			+ "&client_secret=" + clientSecret
			+ "&redirect_uri=fuse-soundcloud://fuse"
			+ "&grant_type=refresh_token"
			+ "&scope=non-expiring"
			+ "&refresh_token=" + refresh_token;

	fetch(uri, {
		method: "POST",
		headers: {
			"Accept": "application/json",
			"Content-type": "application/x-www-form-urlencoded; charset=UTF-8"
		},
		body: body
	}).then(function(response){
		return response.json();
	}).then(function(responseObject){
		console.log("Refresh token response: " + JSON.stringify(responseObject));
		if ("error" in responseObject) {
			console.log("We have an error fetching refresh token");
		} else {
			var newToken = new AccessToken(
				responseObject.access_token,
				responseObject.expires_in,
				responseObject.scope,
				responseObject.refresh_token
			);
			if (callback) {
				callback(newToken);
			}
		}
	}).catch(function(err){
		console.log("Error in Login.js: requestAccessToken");
		console.log(err.message);
		error();
	});
}

InterApp.onReceivedUri = function(uri){
	if (uri.indexOf("fuse?") > -1){
		var splitCode = uri.split("?");
		var code = splitCode[splitCode.length - 1].split("=")[1];
		requestAccessToken(code);
	}
};

function login(){
	requestCode();
}

function logout(){
	isLoggedIn.value = false;
	isLoggingOut = true;
	deleteAccessTokenFromStorage();
}

module.exports = {
	getAccessToken: getAccessToken,
	clientId : clientId,
	clientSecret : clientSecret,
	isLoggedIn : isLoggedIn,
	login : login,
	logout : logout
};
