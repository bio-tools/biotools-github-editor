// #####################################################
// 			CONNECT.js 
// #####################################################
//
// - Get the code returned by OAUTH App call (See index.html)
// --> https://developer.github.com/apps/building-oauth-apps/authorizing-oauth-apps/#1-request-a-users-github-identity
// - Make a POST request to https://github.com/login/oauth/access_token
// --> https://developer.github.com/apps/building-oauth-apps/authorizing-oauth-apps/#2-users-are-redirected-back-to-your-site-by-github
// - If all is ok redirect to search tool page
// - If not ask the user to write is token manally or try to regenerate the code
//
// #####################################################

// /////////////////////////////////////////////////////
// IMPORTS
// /////////////////////////////////////////////////////

import GitHub from "github-api";
import $ from "jquery";
import request from "request";


// /////////////////////////////////////////////////////
// VARIABLE
// /////////////////////////////////////////////////////

// Pages
const page_search="search_tool.html";
// Github personal token of the user
const OAUTH = sessionStorage.getItem("access_token");


// /////////////////////////////////////////////////////
// INIT
// /////////////////////////////////////////////////////

// -----------------------------------------------------
// GITHUB AUTHENTIFICATION
// -----------------------
// Use OAUTH asked and stored by log page
// TODO  CREATE A FUNCTION ON AN OTHER FILE


// If the user is already logged, redirect to search tool page
if(OAUTH){
	location.href = page_search;
}


// -----------------------------------------------------
main();
// -----------------------------------------------------


// /////////////////////////////////////////////////////
// FUNCTIONS
// /////////////////////////////////////////////////////

// -----------------------------------------------------
// MAIN
// ----
// Get the 'code' URL parameter
// Try to get access_token with this code (Cf. github_access())

function main(){

	show_loader();
    // Get the temporary code value returned by github [GET https://github.com/login/oauth/authorize]
    // https://developer.github.com/apps/building-oauth-apps/authorizing-oauth-apps/#1-request-a-users-github-identity 
    let searchParams = new URLSearchParams(window.location.search)
    if (searchParams.has('code')) var code = searchParams.get('code');
    github_access(code);

}

// -----------------------------------------------------
// GITHUB_ACCESS
// -------------
// Post Request on https://github.com/login/oauth/access_token
//   with client_id and client_secret of the app
//   and with personnal code returned by github after login.
//   Response is the access_token to access API.
// -If ot works: redirect to search tool page.   
// -If it does not works: ask the user to enter manually is token
//   (Cf. ask_token())

function github_access(code){
	var options = { method: 'POST',
	url: 'https://github.com/login/oauth/access_token',
	qs: 
	{ client_id: '910ed700e3586d568fc3',
	client_secret: '4b06553041f33c30dc922f8c20a032b9fa35f44c',
	code: code },
	headers: {accept: 'application/json'} 
};

request(options, function (error, response, body) {
	if(!body){
		hide_loader();
         //alert("We could not authentify you with the API request.\n\nError message: \n--\t--\t--\t--\t--\t--\t--\t--\n" + error + "\n--\t--\t--\t--\t--\t--\t--\t--\n\n Please enter you gihub access_token in the the form or try to get a new code");
         ask_token();
     }
     else{
     	var data = JSON.parse(body);
     	if (data['error']){
     		hide_loader();
	        // alert("We could not authentify you with the API request.\n\nError message: \n--\t--\t--\t--\t--\t--\t--\t--\n" + data['error_description'] + "\n--\t--\t--\t--\t--\t--\t--\t--\n\n Please enter you gihub access_token in the the form or try to get a new code");
	        ask_token();
	    }
	    else{
	    	console.log(typeof data);
	    	const access_token=data['access_token'];
	    	hide_loader();
	    	console.log("connected");
	    	search_page(access_token);
	    }	  	
	}


});
}

// -----------------------------------------------------
// SEARCH_PAGE
// -----------
// Redirect to Search Page

function search_page(access_token){
	sessionStorage.setItem("access_token",access_token);
	location.href = page_search;
}

// -----------------------------------------------------
// ASK_TOKEN
// ---------
// Ask the user to enter manually is OAUTH access token
// Try to conenct to Github API with this token

function ask_token(){
	var $div_access_token = $('#div_access_token');
	$div_access_token.show();
	var $btn_access_token = $('#btn_access_token');
	$btn_access_token.on('click', function(event) {
		show_loader();
		var $access_token = $('#access_token');
	 console.log($access_token.val()); //
	 var gh = new GitHub({
	 	token: $access_token.val()
	 });
	 gh.getUser().getProfile(function(err, profile) { 
	 	console.log("--------------------");
	 	console.log(profile);
	 	console.log("--------------------");
	 	hide_loader();
	 	if(!profile){
	 		alert("Authentication failure with token "+$access_token.val());
	 	}
	 	else {
	 		alert(profile["login"]+" connected!");
	 		home($access_token.val());
	 	}
	 });

	});
}

// -----------------------------------------------------
// LOADER
// ------

function show_loader(){
	var $loader = $('#search_loader');
	$loader.show();
}

function hide_loader(){
	var $loader = $('#search_loader');
	$loader.hide();
}

// -----------------------------------------------------
