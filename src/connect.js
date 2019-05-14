import GitHub from "github-api";
//import Repository from "github-api";
import $ from "jquery";
import request from "request";

// ///////////////////////////////////
// VARIABLE
// TODO DOC

const page_search="search_tool.html";
const OAUTH = sessionStorage.getItem("access_token");


// //////////////////////////////////////////////////////////////
// If the user is already logged, redirect to search tool page
if(OAUTH){
	location.href = page_search;
}

// //////////////////////////////////////////////////////////////
// MAIN /////////////////////////////////////////////////////////
// //////////////////////////////////////////////////////////////

main();

// //////////////////////////////////////////////////////////////

function main(){

    show_loader();
    // Get the temporary code value returned by github [GET https://github.com/login/oauth/authorize]
    // https://developer.github.com/apps/building-oauth-apps/authorizing-oauth-apps/#1-request-a-users-github-identity 
    let searchParams = new URLSearchParams(window.location.search)
    if (searchParams.has('code')) var code = searchParams.get('code');
    github_access(code);

}

// //////////////////////////////////////////////////////////////

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
	  console.log(body);
          var data = JSON.parse(body);
          if (data['error']){
	          hide_loader();
                  alert("We could not authentify you with the API request.\n\nError message: \n--\t--\t--\t--\t--\t--\t--\t--\n" + data['error_description'] + "\n--\t--\t--\t--\t--\t--\t--\t--\n\n Please enter you gihub access_token in the the form or try to get a new code");
                  ask_token();
	  }
          else{
          	console.log(typeof data);
	    	  const access_token=data['access_token'];
	          hide_loader();
	          console.log("connected");
	          home(access_token);
	  }
	});
}

// //////////////////////////////////////////////////////////////
// HOME
//
function home(access_token){
    sessionStorage.setItem("access_token",access_token);
    location.href = page_search;
}


// //////////////////////////////////////////////////////////////
// ASK_TOKEN
// TODO: DOC
//
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

// //////////////////////////////////////////////////////////////

function show_loader(){
	var $loader = $('#search_loader');
	$loader.show();
}
function hide_loader(){
	var $loader = $('#search_loader');
	$loader.hide();
}




// //////////////////////////////////////////////////////////////
/////// TEST ZONE ////////

// GET action of "Request" button
var $btn_request = $('#btn_request');
$btn_request.on('click', function(event) {
	github_access();
});

/////// TEST ZONE ////////


