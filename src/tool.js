// #####################################################
// 			TOOL.js 
// #####################################################
//
// - Search a tool on the biotools github repository
// - Record the tool information from json
// - Display the tool
// - Display the PR on the tool
// - Manage tool edition
// - Create Fork,branch,file,pull_request for new entry
//
// #####################################################


// /////////////////////////////////////////////////////
// IMPORTS
// /////////////////////////////////////////////////////

import GitHub from "github-api";
import Repository from "github-api";
import $ from "jquery";
import diff from 'deep-diff'; 
import "./import-jquery";
import "../node_modules/jquery-ui-dist/jquery-ui.js";
import request from "request";

// /////////////////////////////////////////////////////
// VARIABLE
// /////////////////////////////////////////////////////

// Pages
const page_search="search_tool.html";
const page_home="index.html";
// Github repository and user were tools.json are stocked
const gh_bt_user = 'ValentinMarcon';
const gh_bt_repo = 'content';
// Github personal token of the user
const OAUTH = sessionStorage.getItem("access_token");
// Global stock of the user login 
var login="";
// Global stock of all data that we don't want to add to JSON file
var tool_metadata={};


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

// Basic auth on Github API with the token
var gh = new GitHub({
	token: `${OAUTH}`
});

// Retrieve user informations
gh.getUser().getProfile(function(err, profile) { 
	if(!profile){
		alert("Authentication failure with token ");
		location.href = page_home;
	}
	else {
		login = profile["login"];
		let avatar = profile["avatar_url"];
		$('#username').text(login);
		$('#avatar').attr('src', avatar);
	}
});

// Get the repo where tools.json are stocked
var repo = gh.getRepo(gh_bt_user,gh_bt_repo);

// -----------------------------------------------------
// PARSE URL
// ---------
// Get parameter and redirect if necessary

function GetURLParameter(sParam){
	let sPageURL = window.location.search.substring(1);
	var sURLVariables = sPageURL.split('&');
	for (var i = 0; i < sURLVariables.length; i++)
	{
		var sParameterName = sURLVariables[i].split('=');
		if (sParameterName[0] == sParam) return sParameterName[1];
	}
}

// Get "tool" parameter on the url
var tool_on_url=GetURLParameter("tool");
// If a tool is on the parameters search it
if (tool_on_url) search_tool(tool_on_url);
// If not return to search tool page
else window.location.href = page_search;

// /////////////////////////////////////////////////////
// Search Bar:
// /////////////////////////////////////////////////////

function fill_search_bar(repo){
	repo.getContents('master','index.txt',true, function(req, res) {
		var tools = res.split("\n");
		tools.pop();
		$('#search_tool').autocomplete({
			source: tools
		});
	});
}
fill_search_bar(repo);

// /////////////////////////////////////////////////////
// Buttons events:
// /////////////////////////////////////////////////////

// Redirect to search tool page
// $('.btn_search_other').unbind('click').on('click', function(event) {
// 	window.location.href = page_search;
// });

// Send modif made in the form
$('.btn_send').unbind('click').on('click', function(event) {
	send_modif();
});

// Cancel modif made in the form
$('.btn_cancel').unbind('click').on('click', function(event) {
	change_tab(tool_metadata["tab_active"]);
});

// ////////////////////////////////////////////////////
// FUNCTIONS :
// ////////////////////////////////////////////////////

// -----------------------------------------------------
// LOADER
// ------
// Call show_loader when something is loading (Search a tool, Pull Request, ...).
// Then hide it.

function show_loader(){
	$('#search_loader').show();
}
function hide_loader(){
	$('#search_loader').hide();
}

// -----------------------------------------------------
// STORE_ENTRY 
// -----------
// Save an entry in session storage
// If no name is specified the entry will be stored in "default"

function store_entry(entry,name="default_master_entry"){
	sessionStorage.setItem(name,JSON.stringify(entry));
	// If we change the mode to display we inform the app that there is no changes.
	if ((name == "mode") && (entry == "display")) store_entry(false,"changes");
}

// -----------------------------------------------------
// GET_STORED_ENTRY 
// ----------------
// Recover the stored "biotools_entry" 
// If no name is specified it will return the "default" entry stored

function get_stored_entry(name="default_master_entry"){
	var stored=sessionStorage.getItem(name);
	if ((stored) && (stored !== undefined) && (stored !== "undefined")) return(JSON.parse(stored));
	else return false;
}

// -----------------------------------------------------
// SEARCH_TOOL
// -----------
// Search a tool entry from the github repository
// -If the tool does not exist redirect to search page

function search_tool(tool_name){
	show_loader();
	// Get the corresponding json file on the data repository on Github (Cf Github authentifiation above)
	get_tool_entry("master",tool_name,repo,function(res){
		if (!res) {
			alert("'"+tool_name+"' does not exist on bio.tools. \n You can pick a tool in the list");
			hide_loader();
			window.location.href = page_search;
			return;
		}
		else {
			// 1) Store the name of the tool
			tool_metadata["name"]=tool_name;
			// 2.1) Store the json entry in memory 
			store_entry(res);
			// 2.2)Store a empty 'diff' table in memory to manipulate the entry later
			store_entry([],tool_name);
			// 3) Display the master entry into the page
			display_entry(res,tool_name);
			// 4) Search the Pull requests on the entry, store them and print corresponding tabs
			get_pull_requests(tool_name);
			hide_loader();
		}
	});
}

// -----------------------------------------------------
// DISPLAY_ENTRY
// -------------
// - Display mode 
// - Print the tool
// - Add the tab of the tool on the menu
// - Select this tab

function display_entry(entry,name){
	store_entry("display","mode");
	print_tool(entry);
	add_tab(name);
	select_tab(name);
}

// -----------------------------------------------------
// DISPLAY_NEW_ENTRY
// -----------------
// - Display mode 
// - Remove the difference with the original entry
// - Print the difference with the original entry
// - Add the tab of the tool on the menu
// - Select this tab

function display_new_entry(diff_tab,name){
	store_entry("display","mode");
	remove_diff();
	print_diff(diff_tab);
	add_tab(name);
	select_tab(name);
}


// -----------------------------------------------------
// GET_PULL_REQUESTS
// -----------------
// Search the Pull requests on the entry
// For each:
// 1) Store metadata
// 2) Get and store entry 
// 3) Print corresponding tabs

function get_pull_requests(tool_name){
	repo.listPullRequests({},function(req, res) {
		res.forEach(function(pullrequest){
			// Search with the branch name if the Pull Request is on the query tool name
			let branch_name=pullrequest['head']['ref'];	
			let branch_name_lc=branch_name.toLowerCase();
			let regex = new RegExp("^.*_(" + tool_name + "_.*)$");
			if (regex.test(branch_name_lc)){

				// Get Metadatas
				let pr_number=pullrequest['number'];
				let repo_user=pullrequest['head']['repo']['owner']['login'];
				let repo_name=pullrequest['head']['repo']['name'];
				let pr_link=pullrequest['html_url'];
				let pr_date=pullrequest['created_at'];
				let pr_branch=pullrequest['head']['ref'];

				// ID of the new entry on the app
				let new_name = "PR_"+pr_number+"_"+tool_name;

				// Store metadata
				tool_metadata[new_name]={};
				tool_metadata[new_name]['pr_number']=pr_number;
				tool_metadata[new_name]['pr_user']=repo_user;
				tool_metadata[new_name]['pr_link']=pr_link;
				tool_metadata[new_name]['pr_date']=pr_date;
				tool_metadata[new_name]['pr_branch']=pr_branch;

				// Search entry corresponding to the Pull Request
				let my_repo = gh.getRepo(repo_user,repo_name);
				get_tool_entry(branch_name,tool_name,my_repo,function(entry) {
					if(entry){
						// Store the diff between master and the PullRequest in memory to manipulate the entry later
						store_entry(get_diff(entry),new_name);
						add_tab(new_name);
					}
				});
			}
		});
	});

}

// -----------------------------------------------------
// GET_TOOL_ENTRY
// --------------
// WRAP of github.js "getContents()" method.
// Get a json entry from a repo,branch and tool name
// _callback with res of getContents (i.e. entry)

function get_tool_entry(branch_name,tool_name,my_repo,_callback){
	my_repo.getContents(branch_name,'data/'+tool_name+'/'+tool_name+'.json',true, function(error, res) {
		if (!res) {
			throw new Error('Error getting content of ' + tool_name + ' in ' + branch_name + "\n" + error);
		}
		_callback(res);
	});
}

// -----------------------------------------------------
// PRINT_TOOL
// ----------
// Print all json values into a table (html)

function print_tool(entry){
	// Select table to add the tool content
	let $tool_content = $('#tool_content');
	// Erase content
	$tool_content.html("");
	// For every data of the tool entry, print it in a line in the table
	for (var key in entry) {
		if (entry.hasOwnProperty(key)) {
			let new_line = "";
			new_line += "<tr>";
			new_line += val_to_table(key);
			new_line += val_to_table(entry[key],key);
			new_line += "</tr>";
			$tool_content.append(new_line);
		}
	}
	//$tool_content.append("<tr><td class=new_line id="+key+" colspan=2>➕ New Line </td></tr>" ); //TODO WIP

	// Change the title with the tool name
	$('#title').text(tool_metadata["name"]);

	// Table cell that could be modified are selected thanks to the id "value"
	$('td.edit').unbind('click').on('click', function(event) {
		edit_value(this.id.replace('_edit', ''));
	});


	//TODO WIP WIP WIP WIP 
	/*
	var $new_line = $('td.new_line');
	$new_line.on('click', function(event) {
	    // WIP
	    this.innerText="➕ WIP⚠️";
        });
        */
	//TODO WIP WIP WIP WIP

}


// -----------------------------------------------------
// VAL_TO_TABLE 
// ------------
// Recursive function to create table cells 
// according to the format of the entry
// (Null/""; Array; String; Dict)

function val_to_table(entry,id=""){
	var value_to_print="";
	// If there is an empty entry, create a cell with the 'new' class and a cell with a blank indicator
	if (((entry == "") || (entry == null)) && entry !==0){
		let val="";
		if (entry == null){
			val="null";
		}
		else if (Array.isArray(entry)){
			val="[]";
		}
		// REDUNDANT WITH String Entry
		value_to_print += "<td><table id=\""+id+"_tab\">";
        value_to_print += "<tr class=edit id=\""+id+"_tr\" ><td class=\"edit btn\" id=\""+id+"_edit\"><i class=\"icon-edit\"></i></td></tr>";  // EDIT
        value_to_print += "<tr class=reset id=\""+id+"_tr\" hidden><td class=\"reset btn\" id=\""+id+"_reset\"><i class=\"icon-remove-circle\"></i></td></tr>";  // RESET
        value_to_print += "<tr class=valid id=\""+id+"_tr\" hidden><td class=\"valid btn\" id=\""+id+"_valid\"><i class=\"icon-ok\"></i></td></tr>";  // VALID
        value_to_print += "<tr class=cancel id=\""+id+"_tr\" hidden><td class=\"cancel btn\" id=\""+id+"_cancel\"><i class=\"icon-remove\"></i></td></tr>";  // CANCEL
        value_to_print += "</table></td>";
        value_to_print += "<td class=none id=\""+id+"_td\">";
        value_to_print += "<p id=\""+id+"\" class=new>"+val+"</p></td>";
    }
	// If the entry is an array, create a new inner table and recall the function for every sub-entry
	else if (Array.isArray(entry)){
		value_to_print += "<td class=content colspan=2><table>";
		for (var key in entry) {
			value_to_print += "<tr>";
			value_to_print += val_to_table(entry[key],id+"___"+key);
			value_to_print += "</tr>";
		}
		//value_to_print += "<tr><td class=new_line id="+id+" colspan=2>➕ New Line</td></tr>" //TODO WIP
		value_to_print += "</table></td>";
	}
	// If the entry is a string or a number:
	else if (typeof entry == "string" || typeof entry == "number"){
	//   IF "id" is empty it mean that this is the key ('label' class) 
	//   ELSE create a cell with the 'value' class and pencill (meaning 'unmodified')

		// Dont allow user to edit biotoolsID
		if (id === "biotoolsID"){ 
			value_to_print += "<td class=\"bt_id\" style=\"text-align:center;vertical-align:middle;\" title=\"You can not edit bio.tools ID\"><i class=\"icon-minus-sign\"></i></td>";
			value_to_print += "<td class=\"bt_id\" id=\""+id+"_td\" title=\"You can not edit bio.tools ID\">";
			value_to_print += "<p id=\""+id+"\">";
			value_to_print += entry;
			value_to_print += "</p></td>";
		}
		else{
			if (id == ""){
				value_to_print += "<td class=label><p>";
				value_to_print += entry;
				value_to_print += "</p></td>";
			}
			else {
				value_to_print += "<td><table id=\""+id+"_tab\">"
		        value_to_print += "<tr class=edit id=\""+id+"_tr\" ><td class=\"edit btn\" id=\""+id+"_edit\"><i class=\"icon-edit\"></i></td></tr>";  // EDIT
		        value_to_print += "<tr class=reset id=\""+id+"_tr\" hidden><td class=\"reset btn\" id=\""+id+"_reset\"><i class=\"icon-remove-circle\"></i></td></tr>";  // RESET
		        value_to_print += "<tr class=valid id=\""+id+"_tr\" hidden><td class=\"valid btn\" id=\""+id+"_valid\"><i class=\"icon-ok\"></i></td></tr>";  // VALID
		        value_to_print += "<tr class=cancel id=\""+id+"_tr\" hidden><td class=\"cancel btn\" id=\""+id+"_cancel\"><i class=\"icon-remove\"></i></td></tr>";  // CANCEL
		        value_to_print += "</table></td>";
		        value_to_print += "<td class=content id=\""+id+"_td\">";
		        value_to_print += linkit(entry,id);
		        value_to_print += "</td>";
		    }
		}
	}
	// Else, entry is (probably) a dict, recall the function
	else{
		value_to_print += "<td class=content colspan=2><table>";
		for (var key in entry) {
			value_to_print += "<tr>";
			value_to_print += val_to_table(key);
			value_to_print += val_to_table(entry[key],id+"___"+key);
			value_to_print += "</tr>";
		}
		//value_to_print += "<tr><td class=new_line id="+id+" colspan=2>➕ New Line</td></tr>" //TODO WIP
		value_to_print += "</table></td>";
	}
	return value_to_print;
}

// -----------------------------------------------------
// GET_DIFF
// --------
// Return difference between two dict

function get_diff(entry){
	let orig_entry=get_stored_entry();
	return diff(entry, orig_entry);
}

// -----------------------------------------------------
// SEARCH_ON_DICT
// --------------
// Search a value on the dict a position defined in a table

function search_on_dict(entry,tab_pos){
	if (!entry){
		return "value_not_found";
	}
	if(entry[tab_pos[0]]){
		let new_tab_pos=[...tab_pos];
		new_tab_pos.shift();
		if (new_tab_pos.length !== 0) return search_on_dict(entry[tab_pos[0]],new_tab_pos);
		else return entry[tab_pos[0]];
	}
}


// -----------------------------------------------------
// GET_DIFF_MESSAGE
// ----------------
// Get differences between entry to pull and original entry
// Make a Pull Request message from these differences

function get_diff_message(entry){
	// Get diff
	var differences=get_diff(entry);
	// Create PR Message
	var message="### Here are the changes:\n";
	// For each differences
	for (var i in differences) {
		var dif_num=Number(i)+1;
		var dif=differences[i];
		message += dif_num+") Diff in **{";
		var table_path = dif["path"];
		var path="";
		for (var j in table_path){
			if (path) path += "}{";
		    path += table_path[j];
		}
		path += "}**";
		message += path;
		message += "\n";
		message += "-Orig val : "+dif["rhs"]+"\n";
		message += "-New  val : "+dif["lhs"]+"\n";
		message += "\n";
	}
	return message;
}


// -----------------------------------------------------
// PRINT_DIFF
// ----------
// Color differences in the tool table
// 1) Search the path of the html element that has different data
// 2) Print the value that is different
// 3) Add the class 'different' to the parent <td> to color it (Cf. CSS)
// 4) Add attribute to the parent <td> to retrieve default and new values

function print_diff(tab_diff){
	// For each differences
	for (var i in tab_diff) {
		var table_path = tab_diff[i]["path"];
		var difference = tab_diff[i]["lhs"]; 
		var orig = tab_diff[i]["rhs"]; 
		//Search path of changed element in html
		var path=""
		for (var j in table_path){
			if (path) path += "___"; // Separator of deepness of the json (Cf. print_tool())
			path += table_path[j];
		}
		//Change value
		$('#'+path).text(difference);
		//Add the "different" class that will color corresponding background <p> tag
		$('#'+path+'_td').toggleClass('different');
		//Add the original value in the 'title' attribute  of the tag to help the user know the default value
		$('#'+path+'_td').attr('title', String(orig));
		//Add the diff value in the 'pr_value' attribute of the tag to retrieve it in case of change/reset
		$('#'+path+'_td').attr('pr_value', difference);
	}
}


// -----------------------------------------------------
// REMOVE_DIFF
// -----------
// Remove all diferences with master entry displayed
function remove_diff(){
	$('.different,.modified_cell').each(function(){
		// Create <p> or <a> tag with value
		let new_html = linkit($(this).attr('title'),this.firstChild.id);
		$(this.firstChild).replaceWith(new_html);
		$(this).removeClass('different');
		$(this).removeClass('modified_cell');
		$(this).removeAttr('new_value');
		$(this).removeAttr('pr_value');
		$("#"+this.firstChild.id+"_tr.reset").hide();
	});
}



// -----------------------------------------------------
// EDIT_DICT
// ---------
// Recursive function to add modif made by the user 
// to the dict loaded from the github json.
// In input its take the dict (entry), the current position on the dict (pos),
// the table of position to have the position of the entry if its a complex dict (tab_pos),
// the value to add to the dict (value).

function edit_dict(entry,pos,tab_pos,value){
	var new_tab_pos=tab_pos;
	new_tab_pos.shift();
	// While we don't arrived to the end of the table we relaunch the function with next pos entry (deeper in the dict) 
	if (new_tab_pos.length != 0) {
		entry[pos]=edit_dict(entry[pos],tab_pos[0],new_tab_pos,value);
	}
	// Here we arrived to the position to insert the value
	// We insert it and return then the entry modified
	else {
		entry[pos]=value;
	}
	return entry;
}

// -----------------------------------------------------
// EDIT_VALUE 
// ----------
// Change the target tag in "textarea" and hide,show,bind the corresponding buttons

function edit_value(id){

    var orig_v = $('#'+id).text();
    var default_v = $('#'+id+'_td').attr('title');
    var editted_v = $('#'+id+'_td').attr('new_value') || "" ;

    // If there is no title it's mean that the value is the same as the master
    if (!default_v) default_v=orig_v;

	edit_mode(function(){ 
		// Then, transform the tag to a textarea with the original value
		let h = $('#'+id+"_td").height();
		let new_html = "<textarea style='width:100%;height:"+h+"pt' id=\""+id+"\" class=value_edit>"+orig_v+"</textarea>";
		$('#'+id).replaceWith(new_html);
		$('#'+id+"_td").attr('title',default_v);

		// Change edit (and reset) buttons by valid and cancel (modifications).
		$('tr#'+id+'_tr.edit').hide();
		$('tr#'+id+'_tr.reset').hide();
		$('tr#'+id+'_tr.valid').show();
		$('tr#'+id+'_tr.cancel').show();

		// Valid edit event bind
		$('#'+id).keypress(function(event){
			var keycode = (event.keyCode ? event.keyCode : event.which);
			if(keycode == '13'){
				valid_edit(id,orig_v);
			}
		});
		$('#'+id+'_valid').unbind('click').on('click', function(event) {
			valid_edit(id,orig_v);
		});
		// Exit modif event bind
		$('#'+id+'_cancel').unbind('click').on('click', function(event) {
			cancel_edit(id);
		});
  	});
}


// -----------------------------------------------------
// RESET_VALUE 
// -----------
// Reset original value to the cell

function reset_value(id){
    // Select the tag
    let $value_td = $('#'+id+'_td');
    // Get the original value on this tag
    let pr_v = $value_td.attr('pr_value') || "";
    let default_v = $value_td.attr('title') || "";
    let reset_v= pr_v || default_v;

	// Create <p> or <a> tag with value
	let new_html = linkit(reset_v,id);
	$('#'+id).replaceWith(new_html);
	$('tr#'+id+'_tr.reset').hide();
	$value_td.removeClass('modified_cell');
	$value_td.removeAttr('new_value');
	// If there is no more modified cell: exit the edit mode
	if ($('.modified_cell').length === 0)exit_edit_mode();
}


// -----------------------------------------------------
// LINKIT
// ------
// Create a <p> tag with the value and add a <a> tag if necessary

function linkit(value,id){
	// Start with 'http(s)://' and don't has whitespace after (i.e. no other words)
	const regex_website=/^http[s]?:\/\/\S*$/;
	// If it is a url : create a <a> tag in <p>
	if (regex_website.test(value)) return "<p id=\""+id+"\" class=\"value\"><a href=\"" + value + "\" target=\"_blank\">" + value + "</a></p>";
	// Else create just the <p> tag
	else return "<p id=\""+id+"\" class=\"value\">" + value + "</p>";
}


// -----------------------------------------------------
// EDIT_MODE 
// ---------
// Change to edit mode if it is not already setted

function edit_mode(_cb){
    // If we are not currently on 'edit' mode
    if (get_stored_entry("mode") != "edit"){
    	store_entry("edit","mode");
    	console.log(tool_metadata["tab_active"]+" : edit mode");
    }
    _cb();
}

// -----------------------------------------------------
// EXIT_EDIT_MODE
// --------------
// - Change to 'display mode'
// - Hide the edit btns

function exit_edit_mode(){
	store_entry("display","mode");
	$('button.edit_mode').hide();//buttons
	$('#edited').hide();
	$('.value_edit').each(function(){
		cancel_edit($(this).attr('id'));
	});
}

// -----------------------------------------------------
// VALID_EDIT
// ----------
// Save value edit 

function valid_edit(id,orig_v){

	var entry_id = tool_metadata["tab_active"];
	var $value_new = $('#'+id);
	var $value_td = $('#'+id+"_td");
	var new_v = $value_new.val();
	var motif =  /___/;
	// Get the position liste of the value from the id (Cf. "val_to_table")
	var liste = id.split(motif);
	var default_val= $value_td.attr("title");
	var orig_val=$value_td.attr("pr_value") || default_val;

	// If the value is the same from the original
	// We keep original status
	if (orig_val === new_v ){
		$value_td.removeClass("modified_cell");
		$value_td.removeAttr('new_value');
		if ($('.modified_cell').length === 0){
			exit_edit_mode();
		}
	}
	// Else, if the value is found and different
	else {
	    // Retrieve stored entry
	    var entry_id = tool_metadata["tab_active"];
	    var new_entry_id = entry_id+"_new";

	    // If it is the first time we edit the entry we take the original one
	    if (!get_stored_entry("changes")){
	    	var tab_diff=get_stored_entry(entry_id);
	    }
	    else {
	    	var tab_diff=get_stored_entry(new_entry_id);
	    }

	    var new_diff={};
	    new_diff["kind"]="E";
	    new_diff["lhs"]= new_v;
	    new_diff["path"]= liste;
	    new_diff["rhs"]= default_val;
	    // Remove old diff if it concern the same element
	    for (var diff in tab_diff){
	    	if (tab_diff[diff]["path"].toString() === new_diff["path"].toString()) {
	    		tab_diff.splice(diff,1);
	    	}
	    }
	    tab_diff.push(new_diff);
	    // Store it
	    store_entry(tab_diff,new_entry_id);

        // Changes have been made, we record the status to true and show the btn to send changes into PR
        store_entry(true,"changes");
	    $('button.edit_mode').show();//buttons
	    $('#edited').show();
	    
	    $value_td.addClass("modified_cell");

	}

	var new_html = "";
	// Create <p> or <a> tag with value
	new_html += linkit(new_v,id);
	$value_new.replaceWith(new_html);

	$('tr#'+id+'_tr.valid').hide();
	$('tr#'+id+'_tr.cancel').hide();
	$('tr#'+id+'_tr.edit').show();
	if ((orig_val) && (orig_val !== new_v )){
		$('tr#'+id+'_tr.reset').show();
		$value_td.attr( "new_value", new_v);
	}

	// Edit value rebind
	$('#'+id+'_edit').unbind('click').on('click', function(event) {
		edit_value(this.id.replace('_edit', ''));
	});
	// Reset value rebind
	$('#'+id+'_reset').unbind('click').on('click', function(event) {
		reset_value(this.id.replace('_reset', ''));
	});
}


// -----------------------------------------------------
// CANCEL_EDIT
// -----------
// Reset values and hide,show all the corresponding button

function cancel_edit(id){

	var value=$('#'+id+'_td').attr("new_value") || ($('#'+id+'_td').attr("pr_value") || $('#'+id+'_td').attr("title")); 
    // Create <p> or <a> tag with value
    var new_html = linkit(value,id);
    $('#'+id).replaceWith(new_html);
    $('tr#'+id+'_tr.valid').hide();
    $('tr#'+id+'_tr.cancel').hide();
    $('tr#'+id+'_tr.edit').show();
    if ($('#'+id+'_td').attr("new_value")){
    	$('tr#'+id+'_tr.reset').show();
    }
	// Edit value rebind
	$('#'+id+'_edit').unbind('click').on('click', function(event) {
		edit_value(this.id.replace('_edit', ''));
	});
}


// -----------------------------------------------------
// ADD_TAB
// -------
// Create a new tab on the menu according to the 'id' provided
// 'value' is printed on the tab and by default is the id 

function add_tab(id){
	var $tab = $('#tab');
	const regex = new RegExp("^(PR|edit|NEW)_[a-zA-Z0-9_-]*$");
	var classs="master";
	var value="Master branch";
	// If it is not the master branch
	if (regex.test(id)){
		classs=id.replace(regex,'$1');
		value="Pull Request n°"+tool_metadata[id]["pr_number"];
	}
	$tab.append("<li id="+id+" class="+classs+"><a>"+value+"</a></li>");
	// Rebind events onclick on the tabs of the menu
	add_tab_event();
}

// -----------------------------------------------------
// SELECT_TAB
// ----------
// Select a tab according to the 'id' provided

function select_tab(id){
	var $tab = $('#'+id);
	// Unset 'active' the current active tab 
	var $tab_active = $('#menu li.active');
	$tab_active.removeClass('active');
	// Set this new selected tab 'active'
	$tab.toggleClass('active');
	// Re-add events onclick on the tabs of the menu
	add_tab_event();
	// Display tool metadata according to selected tab
	update_header(id);
	// Update id of tab selected
	tool_metadata["tab_active"]=id;
}


// -----------------------------------------------------
// ADD_TAB_EVENT
// ------------
// Add event 'change_tab()' to all the not active tab

function add_tab_event(){
	$("#menu li").unbind('click');
	$("#menu li:not('.active')").on('click', function(event){
		change_tab(this.id);
	});
}


// -----------------------------------------------------
// CHANGE_TAB
// ----------
// - Check if the user can leave the active tab
// - Print the differences of the selected tab
// - Visual change tab with select_tab() on the selected tab id

function change_tab(id_tab_selected){
	console.log(id_tab_selected+" : selected");

	// Check if its possible to change tab
	if ($('.modified_cell').length !== 0){
		var quit=confirm("All modifications will be lost.\n  -Press OK to leave edit mode\n  -Press \"Cancel\" to return to edit mode");
		if (quit) {
			exit_edit_mode();
		}
		else {
			let pos = $('.modified_cell').offset();
			let top = pos.top - 100;
			let left = pos.left - 20;
			window.scrollTo((left < 0 ? 0 : left), (top < 0 ? 0 : top));
			return;
		}
	}
	else if (get_stored_entry("mode")=="edit") {
		exit_edit_mode();
	}

	// If the user choose the master tab
	if (id_tab_selected == tool_metadata['name']) {
		remove_diff();
		select_tab(id_tab_selected);
	}
	// Else,show diff
	else {
		// - Retrieve entry
		var $tab_selected = $('#'+id_tab_selected);
		var diff_tab=get_stored_entry(id_tab_selected);

		if (diff_tab){
			// - Print diff and Visual select the tab on menu
			remove_diff();
			print_diff(diff_tab);
			select_tab(id_tab_selected);
		}
		else { 
			alert("This tab does not exist or is not well formated (Contact administrator)")
			console.log("Entry " + id_tab_selected + "does not exist"); 
			$tab_selected.remove();
			remove_diff();
			select_tab(tool_metadata["name"].toLowerCase());
		}
	}
}


// -----------------------------------------------------
// UPDATE_HEADER
// -------------
// Display tool metadatas in header according to selected tab

function update_header(id){

	// JQUERY select elements
	var $title = $('#title');
	var $subtitle = $('p#subtitle');
	var $subtitle_link = $('a#pr_link');
	var $subtitle_date = $('p#pr_date');
	var $subtitle_author = $('p#pr_author');
	var $subtitle_author_you = $('p#pr_author_you');

	// Change Title
	$title.text(tool_metadata["name"]);
	// Change Bio.tools link (behind title)
	$title.attr("href", "https://bio.tools/"+tool_metadata["name"].toLowerCase());

	// Empty Metadatas
	$subtitle.text("-");
	$subtitle_link.text("-");
	$subtitle_date.text("-");
	$subtitle_author.text("-");
	$subtitle_author_you.hide();

	// Search the status of the entry (Master,Pull request or New)
	var regex = new RegExp("^([a-zA-Z0-9]*)_[a-zA-Z0-9_-]*$");
	var status = id.replace(regex, '$1');
	var status_converter={"PR":"Pull Request n°","NEW":"New Pull Request n°"};
	var status_long=status_converter[status];

	// Display metadatas
	if (tool_metadata[id]){
		var pr_user=tool_metadata[id]['pr_user'];
		var pr_link=tool_metadata[id]['pr_link'];
		var pr_date=tool_metadata[id]['pr_date'];
		var pr_number=tool_metadata[id]['pr_number'];
		// USER that made the Pull Request
		if (pr_user) {
			$subtitle_author.text("By '"+pr_user+"'");
			if (pr_user === login) {
				$subtitle_author_you.show();
			}
		}
		// LINK and NUMBER of the Pull Request
		if (pr_link) {
			if (pr_number) $subtitle_link.text(" Pull Request #"+pr_number);
			else $subtitle_link.text(" Pull Request");
			$subtitle_link.attr("href", pr_link);
		}
		// DATE of the Pull Request
		if (pr_date) {
			var day=pr_date.split("T")[0];
			var hour=pr_date.split("T")[1];
			var print_date=day+" at "+hour.split(":")[0]+":"+hour.split(":")[1];
			$subtitle_date.text("Created on "+print_date);
		}
	}

	// Edit status
	if (!status_long) {
		status_long="Origin";
		$subtitle_link.text("Master");
		$subtitle_link.attr("href", "https://github.com/"+gh_bt_user+"/"+gh_bt_repo);
	}
	else if (status="PR") {
		status_long += pr_number;
	}
	$subtitle.text(status_long);

	
}

// -----------------------------------------------------
// SEND_MODIF
// ----------
// 1) Get the stored entry (modified by the user)
// 2) Fork the bio.tools repo into user github
// 3) Create a new branch on the github repo from the "dev" branch
// 4) Write a file in this new branch with this new entry
// 5) Make a pull request to the dev branch
//
// TODO : Improve user experience and error management (learn to use promise)
//

function send_modif(){
	var repo_name=gh_bt_repo;
	// If some changes are not validated don't send and show the user the line
	if ($('.value_edit').length !== 0) {
		alert("Some changes have not been validated");
		let pos = $('.value_edit').offset();
		let top = pos.top - 100;
		let left = pos.left - 20;
		window.scrollTo((left < 0 ? 0 : left), (top < 0 ? 0 : top));
		return;
	}
	// If we are here but no changes have been made don't create a pull request
	if (!get_stored_entry("changes")){
		return;
	}
	// Ensure the user want to make the PR
	if (!confirm("Are you sure to make this Pull Request?")){
		return;
	}
	// Ask if the user allow the app to fork the repo in his Github account
	var repo_forked = gh.getRepo(login,repo_name);
	if(!repo_forked){
		let confirm_fork=confirm("You don't have the repo '"+repo_name+"' forked on your account the app will do it for you. Do you allow it?"); 
		if (!confirm_fork){
			return;
		}
	}

	show_loader();	
	console.log(tool_metadata["tab_active"]+" changes will be recorded");
	
	// 1)
	// Get the original Entry
	var entry=get_stored_entry();
	// Edit this entry with modifs
	var tab_modif=get_stored_entry(tool_metadata["tab_active"]+"_new");
	for (var m in tab_modif){
		var modif=tab_modif[m];
		entry = edit_dict(entry,modif["path"][0],modif["path"],modif["lhs"]);
	}
	// Lower Case id of the tool
	var tool_name = tool_metadata["name"].toLowerCase();
	// File name in which changes will be saved
	var file_name=tool_name+".json";
	// Path of the file in github
	var file_path="data/"+tool_name+"/"+file_name;

	var id = tool_metadata["tab_active"];  //TODO top doublon

	// UPDATE PULL REQUEST
	if ((tool_metadata[id]) && (tool_metadata[id]['pr_user'] === login)){

		var pr_number=tool_metadata[id]['pr_number'];	
		var my_bt_entry=JSON.stringify(entry, null, " ");
		var body_message=get_diff_message(entry);
		var branch_origin=tool_metadata[id]['pr_branch'];	

		// 2)
		// Get the Sha of the file to update
		// Can not get the Sha with GET request to the file so do it on the repo...
		// Warning: Can change according to the Github API updates
		let options = { method: 'GET',
		  url: 'https://api.github.com/repos/'+login+'/content/contents/data/'+tool_name+'?ref='+branch_origin 
		};
		request(options, function (error, res, body) {
			if (error) {
				hide_loader();	
				exit_edit_mode();
				alert("Error updating Pull Request \n\n'"+error+"'");
				throw new Error(error);
			}
			var data = JSON.parse(body);
			var my_sha ="";
			for (var res in data){
				if (data[res]["path"] === file_path){
					my_sha = data[res]["sha"];
				}
			}
			if (!my_sha){
				hide_loader();	
				exit_edit_mode();
				alert("Error updating Pull Request \n\n'"+data["message"]+"'");
				throw new Error(data["message"]);
			}
			// 3)
			// New commit with new content
			let options = { method: 'PUT',
			url: 'https://api.github.com/repos/'+login+'/content/contents/'+file_path,
			headers: 
			{ 
				authorization: "Basic " + new Buffer(login + ":" + OAUTH).toString("base64"),
				'content-type': 'application/json' },
				body: 
				{ message: 'Update Pull Request n°'+pr_number,
				content: new Buffer(my_bt_entry).toString("base64"),
				sha: my_sha,
				branch: branch_origin },
				json: true };
				request(options, function (error, res, body) {
					if(!body){
						hide_loader();	
						exit_edit_mode();
						alert("Error updating Pull Request \n\n'"+error+"'");
						throw new Error(error);
					}
					else{
					// 4)
					// Update body message of the PR
					var repo_orig = gh.getRepo(gh_bt_user,repo_name);
					repo_orig.updatePullRequest(pr_number,{"body": body_message},function(error,res){
						if (!res) {
							hide_loader();	
							exit_edit_mode();
							alert("Error updating Pull Request \n\n'"+error+"'");
							throw new Error(error);
						}
						else {
							console.log("File updated in https://github.com/"+login+"/"+repo_name+"/tree/"+branch_origin+"/"+file_path);
							alert("Update Pull Request Done!");
							hide_loader();	
							exit_edit_mode();
							tab_modif=get_stored_entry(tool_metadata["tab_active"]+"_new");
							// Store the diff entry in memory to manipulate the entry later
							store_entry(tab_modif,tool_metadata["tab_active"]);
							$('.different,.modified_cell').each(function(){
								// Create <p> or <a> tag with value
								let new_html = linkit(this.firstChild.innerText,this.firstChild.id);
								$(this.firstChild).replaceWith(new_html);
								$(this).removeClass('modified_cell');
								$(this).addClass('different');
								$(this).attr('pr_value',$(this).attr('new_value'));
								$(this).removeAttr('new_value');
								$("#"+this.firstChild.id+"_tr.reset").hide();
							});
						}
					});
				}
			});
		});
	}
	// NEW PULL REQUEST
	else {
		
		// Current date
		const d = new Date();
		const now=d.getFullYear()  + "-" + (d.getMonth()+1) + "-" +  d.getDate() + "-" + d.getHours() + "-" + d.getMinutes() + "-" + d.getSeconds() + "-" + d.getMilliseconds();
		// Branch name with current date and 'new' tag
		var branch_name="new_"+tool_name+"_"+now;
		// Origin branch in which the Fork and Pull Request will be done
		var branch_origin="dev";
		// Convert the entry to JSON to record it on the json file
		var my_bt_entry=JSON.stringify(entry, null, " ");
		// 2)
		// Fork the repo into registered user github (if it dont exist)
		repo.fork(function(error,res){
			if (!res) {
				hide_loader();	
				alert("Error creating fork of '"+gh_bt_user+"/"+gh_bt_repo+"' in your Github account");
				throw new Error(error);
			}
			else {
				// Retrieve then the forked repo
				var repo_forked = gh.getRepo(login,repo_name);
				// 3)
				// Create the new branch on the forked repo
				repo_forked.createBranch(branch_origin,branch_name,function(error,res){
					if (!res) {
						hide_loader();
						alert("Error creating branch '"+branch_name+"' from '"+branch_origin+"'");
						throw new Error(error);
					}
					else {
						// 4)
						// Create the json file on this new branch on the forked repo
						repo_forked.writeFile(branch_name,file_path,my_bt_entry,'Write in '+file_name,{},function(error,res){
							if (!res) {
								hide_loader();
								alert("Error creating file '"+file_name+"' in '"+branch_name+"'");
								throw new Error(error);
							}
							else {
								// 5)
								// 5.1) Get differences between orig tool entry and new one
								var body=get_diff_message(entry);
								// 5.2) Create Pull Request from the new branch on the repo forked to the base repository dev branch
								var result=repo.createPullRequest({
									"title": "Update/create "+file_name,
									"body": "Please pull this in!\n--------------------\n"+body,
									"head": login+":"+branch_name,
									"base": branch_origin
								},function(error,res){
									if (!res) {
										hide_loader();
										alert("Error creating Pull Request from '"+login+":"+file_name+"' to origin:'"+branch_origin);
										throw new Error(error);
									}
									else {
										console.log("New file writed in https://github.com/"+login+"/"+repo_name+"/tree/"+branch_name+"/"+file_path);
										alert("Pull Request Done!");
										hide_loader();	
										exit_edit_mode();
										console.log(res);
										let pr_number=res["number"];
										let new_name="NEW_PR_"+pr_number+"_"+tool_name;

										// Store metadata
										tool_metadata[new_name]={};
										tool_metadata[new_name]['pr_link']=res["html_url"];
										tool_metadata[new_name]['pr_number']=pr_number;	
										tool_metadata[new_name]['pr_user']=res['head']['repo']['owner']['login'];
										tool_metadata[new_name]['pr_date']=res['created_at'];
										tool_metadata[new_name]['pr_branch']=res['head']['ref'];

										// Find the diff table of the current tool edited
										tab_modif=get_stored_entry(tool_metadata["tab_active"]+"_new");
										// Store the json entry in memory to manipulate the entry later
										store_entry(tab_modif,new_name);
										display_new_entry(tab_modif,new_name);
									}
								});
							}
						});
					}
				});
			}
		});	
	}
}