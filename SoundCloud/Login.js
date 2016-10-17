var Observable = require("FuseJS/Observable");
var Auth = require("Auth");
var Model = require("SoundCloud/Model");

var me = Auth.isLoggedIn.map(function(x){
	if (x) {
		return Model.GetMe();
	}
	return false;
});

function login(){
	Auth.login();
}

function logout(){
	Auth.logout();
}

module.exports = {
	isLoggedIn : Auth.isLoggedIn,
	me : me,
	login : login,
	logout : logout
};
