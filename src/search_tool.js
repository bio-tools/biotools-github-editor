import GitHub from "github-api";
import Repository from "github-api";
import $ from "jquery";

// ///////////////////////////////////
// VARIABLE
//
const page_tool="tool.html";
const page_home="index.html";

const gh_bt_user = 'ValentinMarcon';
const gh_bt_repo = 'content';

// ///////////////////////////////////
// Parse URL and redirect:

function GetURLParameter(sParam){
	    var sPageURL = window.location.search.substring(1);
	    var sURLVariables = sPageURL.split('&');
	    for (var i = 0; i < sURLVariables.length; i++)
	    {
	        var sParameterName = sURLVariables[i].split('=');
	        if (sParameterName[0] == sParam)
	        {
	            return sParameterName[1];
	        }
	    }
}

// If a tool is on the url parameter as "?tool=tool_name" redirect to tool page.
var tool_on_url=GetURLParameter("tool");
if (tool_on_url){
    	window.location.href = page_tool+"?tool="+tool_on_url;
}

// ///////////////////////////////////
// Github authentification:

// Use OAUTH asked and stored by log page
const OAUTH = sessionStorage.getItem("access_token");

// If the user is here without OAUTH token, redirect to connexion page
if(!OAUTH){
	location.href = page_home;
}

// Basic auth
var gh = new GitHub({
  token: `${OAUTH}`
});

// Get user info
gh.getUser().getProfile(function(err, profile) { 
		if(!profile){
			alert("Authentication failure with token ");
			location.href = page_home;
		}
		else {
			var login = profile["login"];
			var avatar = profile["avatar_url"];
			var $login = $('#username');
			var $avatar = $('#avatar');
			$login.text(login);
			$avatar.attr('src', avatar);
		}
});

// Get the repo where tools.json are stocked
var repo = gh.getRepo(gh_bt_user,gh_bt_repo);

// ///////////////////////////////////
// FILL_TOOL_LIST

function fill_tool_list(repo){
	var $tool_list_obj = $('#tool_list');
	repo.getContents('master','index.txt',true, function(req, res) {
		var tools = res.split("\n");
		tools.pop();
		for (var tool in tools) {
		    $tool_list_obj.append("<OPTION>"+tools[tool]);
		}
		var $btn_select = $('.btn_select');
		$btn_select.show();
		var $option_not_found = $("#tool_list option[id='not_found']");
		$option_not_found.remove();
	});
}

// Fill the tool list:
fill_tool_list(repo);

// ///////////////////////////////////
// SEARCH_TOOL
// Search a tool entry from the github repository

function search_tool($search_tool,_cb){
	// Value entered/choosed by the user
	var tool_name = $search_tool.val();
	location.href = page_tool + "?tool=" + tool_name;
}

// ///////////////////////////////////
// Buttons events:

var $btn_search = $('.btn_search');
var $btn_select = $('.btn_select');

$btn_search.on('click', function(event) {
	// Input text to search a tool
	search_tool($('#search_tool'));
});

$btn_select.on('click', function(event) {
	// Select tag to choose the tool to search
	search_tool($('#tool_list'));
});

// ///////////////////////////////////



// WIP ZONE // WIP ZONE // WIP ZONE //
// WIP ZONE // WIP ZONE // WIP ZONE //
// WIP ZONE // WIP ZONE // WIP ZONE //
// WIP ZONE // WIP ZONE // WIP ZONE //


// ///////////////////////////////////
// Autocomplete TODO  WIPWIPWIP TODO (JQUERY PROBLEMS)
/*
var availableTags = [
      "ActionScript",
      "AppleScript",
      "Asp",
      "BASIC",
      "C",
      "C++",
      "Clojure",
      "COBOL",
      "ColdFusion",
      "Erlang",
      "Fortran",
      "Groovy",
      "Haskell",
      "Java",
      "JavaScript",
      "Lisp",
      "Perl",
      "PHP",
      "Python",
      "Ruby",
      "Scala",
      "Scheme"
 ];

var $search_tool = $('#search_tool');
console.log($search_tool);
('#search_tool').autocomplete({
     source: availableTags
});
*/


// WIP ZONE // WIP ZONE // WIP ZONE //
// WIP ZONE // WIP ZONE // WIP ZONE //
// WIP ZONE // WIP ZONE // WIP ZONE //
// WIP ZONE // WIP ZONE // WIP ZONE //



