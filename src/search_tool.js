// #####################################################
// 			SEARCH_TOOL.js 
// #####################################################
//
// - Retrieve all biotools from index.txt 
// - Display the list of tools
// - Display a free input text
// - Request the tool page with the choosen tool in parameter
//
// #####################################################


// /////////////////////////////////////////////////////
// IMPORTS
// /////////////////////////////////////////////////////

import GitHub from "github-api";
import Repository from "github-api";
import $ from "jquery";
import "./import-jquery";
import "../node_modules/jquery-ui-dist/jquery-ui.js";


// /////////////////////////////////////////////////////
// VARIABLE
// /////////////////////////////////////////////////////

// Pages
const page_tool="tool.html";
const page_home="index.html";
// Github repository and user were tools.json are stocked
const gh_bt_user = 'ValentinMarcon';
const gh_bt_repo = 'content';
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

// -----------------------------------------------------
// PARSE URL
// ---------
// Get parameter and redirect if necessary

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

// -----------------------------------------------------
// FILL_TOOL_LIST
// --------------
// Get the bio.tools list from the index of the Master Branch
// List these tools on the html tool list

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

		var $search_tool = $('#search_tool');
		console.log($search_tool);
		$('#search_tool').autocomplete({
			autoFocus: true,
		    source: tools
		});


	});
}

// -----------------------------------------------------
// Fill the tool list:
// TODO HAVE AUTOCOMPLETION WILL BE NICE
fill_tool_list(repo);


// ////////////////////////////////////////////////////
// FUNCTIONS :
// ////////////////////////////////////////////////////

// -----------------------------------------------------
// SEARCH_TOOL
// -----------
// Search a tool entry from the github repository

function search_tool($search_tool,_cb){
	// Value entered/choosed by the user
	var tool_name = $search_tool.val();
	if (tool_name) location.href = page_tool + "?tool=" + tool_name;
}


// /////////////////////////////////////////////////////
// Buttons events:
// /////////////////////////////////////////////////////

$('.btn_search').on('click', function(event) {
	// Input text to search a tool
	search_tool($('#search_tool'));
});

// -----------------------------------------------------
$('.btn_select').on('click', function(event) {
	// Select tag to choose the tool to search
	search_tool($('#tool_list'));
});

// -----------------------------------------------------
$('#search_tool').keypress(function(event){
var keycode = (event.keyCode ? event.keyCode : event.which);
if(keycode == '13'){
		search_tool($('#search_tool'));
}
});

// -----------------------------------------------------
//   WIP ZONE // WIP ZONE // WIP ZONE // WIP ZONE //
// -----------------------------------------------------
// $(document).ready(function(){
// var liste = [
//     "Draggable",
//     "Droppable",
//     "Resizable",
//     "Selectable",
//     "Sortable"
// ];

// $('#recherche').autocomplete({
//     source : liste
// });
// });
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

// -----------------------------------------------------
