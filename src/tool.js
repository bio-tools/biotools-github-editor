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

// Get "tool" parameter on the url
var tool_on_url=GetURLParameter("tool");
// If a tool is on the parameters search it
if (tool_on_url){
	search_tool(tool_on_url);
}
// If not return to search tool page
else {
	window.location.href = page_search;

}

// /////////////////////////////////////////////////////
// Buttons events:
// /////////////////////////////////////////////////////

var $btn_search_other = $('.btn_search_other');
var $btn_send = $('.btn_send');
var $btn_cancel = $('.btn_cancel');

// Redirect to search tool page
$btn_search_other.unbind('click').on('click', function(event) {
	window.location.href = page_search;
});

// Send modif made in the form
$btn_send.unbind('click').on('click', function(event) {
	send_modif();
});

// Cancel modif mode and come back to the "master" tab
$btn_cancel.unbind('click').on('click', function(event) {
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
	var $loader = $('#search_loader');
	$loader.show();
}
function hide_loader(){
	var $loader = $('#search_loader');
	$loader.hide();
}

// -----------------------------------------------------
// STORE_ENTRY 
// -----------
// Save an entry in session storage
// If no name is specified the entry will be stored in "default"

function store_entry(entry,name="default_master_entry"){
	sessionStorage.setItem(name,JSON.stringify(entry));
	if ((name == "mode") && (entry == "display")){
		// If we change the mode to display we inform the app that there is no changes.
		store_entry(false,"changes");
	}

}

// -----------------------------------------------------
// GET_STORED_ENTRY 
// ----------------
// Recover the stored "biotools_entry" 
// If no name is specified it will return the "default" entry stored

function get_stored_entry(name="default_master_entry"){
	var stored=sessionStorage.getItem(name);
	if (stored) return(JSON.parse(stored));
	else return false; // TODO manage this false return for callers
}

// -----------------------------------------------------
// SEARCH_TOOL
// -----------
// Search a tool entry from the github repository
// -If the tool does not exist redirect to search page
//  TODO Autocompletion

function search_tool(tool_name){
	// Value entered/choosed by the user
	show_loader();
	// Get the corresponding json file on the data repository on Github (Cf Github authentifiation above)
	
	
	//repo.getContents('master','data/'+tool_name+'/'+tool_name+'.json',true, function(req, res) {
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
// -----------------
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
// TODO DOC
// - Display mode 
// - Print the tool
// - Add the tab of the tool on the menu
// - Select this tab

function display_new_entry(diff_tab,name){
	  store_entry("display","mode");
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
//
// TODO manage get_tool_entry error

function get_pull_requests(tool_name){
        repo.listPullRequests({},function(req, res) {
           res.forEach(function(pullrequest){

		// Search with the branch name if the Pull Request is on the query tool name
		var branch_name=pullrequest['head']['ref'];	
		var branch_name_lc=branch_name.toLowerCase();
                var regex = new RegExp("^.*_(" + tool_name + "_.*)$");
		if (regex.test(branch_name_lc)){

			// Get Metadatas
			var pr_number=pullrequest['number'];
			var repo_user=pullrequest['head']['repo']['owner']['login'];
			var repo_name=pullrequest['head']['repo']['name'];
			var pr_link=pullrequest['html_url'];
			var pr_date=pullrequest['created_at'];
			var pr_branch=pullrequest['head']['ref'];

			// ID of the new entry on the app
			var new_name = "PR_"+pr_number+"_"+tool_name;

			// Store metadata
			tool_metadata[new_name]={};
			tool_metadata[new_name]['pr_number']=pr_number;
			tool_metadata[new_name]['pr_user']=repo_user;
			tool_metadata[new_name]['pr_link']=pr_link;
			tool_metadata[new_name]['pr_date']=pr_date;
			tool_metadata[new_name]['pr_branch']=pr_branch;
	
			// Search entry corresponding to the Pull Request
			var my_repo = gh.getRepo(repo_user,repo_name);
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
	my_repo.getContents(branch_name,'data/'+tool_name+'/'+tool_name+'.json',true, function(req, res) {
		if (!res) {
			console.log('Error getting content of ' + tool_name + ' in ' + branch_name + "\n" + req);
		}
		_callback(res);
	});
}

// -----------------------------------------------------
// PRINT_TOOL
// ----------
// Print all json values into a table (html)
//
// TODO : Manage new content 

function print_tool(entry){
	// Select table to add the tool content
	var $tool_content = $('#tool_content');
	// Erase content
	$tool_content.html("");
	// For every data of the tool entry, print it in a line in the table
	for (var key in entry) {
	    if (entry.hasOwnProperty(key)) {
		var new_line = ""
		new_line += "<tr>"
		new_line += val_to_table(key)
		new_line += val_to_table(entry[key],key)
		new_line += "</tr>"
		$tool_content.append(new_line);
	    }
	}
	//$tool_content.append("<tr><td class=new_line id="+key+" colspan=2>➕ New Line </td></tr>" ); //TODO WIP

	// Change the title with the tool name
	var $title = $('#title');
	$title.text(tool_metadata["name"]);
	
	// Show cells that are differennt from master
	show_diff(entry);

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
//

function val_to_table(entry,id=""){
	var value_to_print="";
	// If there is an empty entry, create a cell with the 'new' class and a cell with a blank indicator
	if (((entry == "") || (entry == null)) && entry !==0){
		var val=""
		if (entry == null){
		  val="null"
		}
		else if (Array.isArray(entry)){
		  val="[]"
		}
		// REDUNDANT WITH String Entry
        value_to_print += "<td><table id=\""+id+"_tab\">"
        value_to_print += "<tr class=edit id=\""+id+"_tr\" ><td class=\"edit btn\" id=\""+id+"_edit\"><i class=\"icon-edit\"></i></td></tr>"  // EDIT
        value_to_print += "<tr class=reset id=\""+id+"_tr\" hidden><td class=\"reset btn\" id=\""+id+"_reset\"><i class=\"icon-remove-circle\"></i></td></tr>"  // RESET
        value_to_print += "<tr class=valid id=\""+id+"_tr\" hidden><td class=\"valid btn\" id=\""+id+"_valid\"><i class=\"icon-ok\"></i></td></tr>"  // VALID
        value_to_print += "<tr class=cancel id=\""+id+"_tr\" hidden><td class=\"cancel btn\" id=\""+id+"_cancel\"><i class=\"icon-remove\"></i></td></tr>"  // CANCEL
        value_to_print += "</table></td>";
		value_to_print += "<td class=none><p id=\""+id+"\" class=new>"+val+"</p></td>"
	}
	// If the entry is an array, create a new inner table and recall the function for every sub-entry
	else if (Array.isArray(entry)){
		value_to_print += "<td class=content colspan=2><table>";
		for (var key in entry) {
			 value_to_print += "<tr>"
			 value_to_print += val_to_table(entry[key],id+"___"+key)
			 value_to_print += "</tr>"
		}
		//value_to_print += "<tr><td class=new_line id="+id+" colspan=2>➕ New Line</td></tr>" //TODO WIP
		value_to_print += "</table></td>";
	}
	// If the entry is a string or a number:
	else if (typeof entry == "string" || typeof entry == "number"){
	//   IF "id" is empty it mean that this is the key ('label' class) 
	//   ELSE create a cell with the 'value' class and pencill (meaning 'unmodified')

		if (id === "biotoolsID"){
			value_to_print += "<td class=\"bt_id\" style=\"text-align:center;vertical-align:middle;\" title=\"You can not edit bio.tools ID\"><i class=\"icon-minus-sign\"></i></td>";
			value_to_print += "<td class=\"bt_id\" id=\""+id+"_td\" title=\"You can not edit bio.tools ID\">"
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
		        value_to_print += "<tr class=edit id=\""+id+"_tr\" ><td class=\"edit btn\" id=\""+id+"_edit\"><i class=\"icon-edit\"></i></td></tr>"  // EDIT
		        value_to_print += "<tr class=reset id=\""+id+"_tr\" hidden><td class=\"reset btn\" id=\""+id+"_reset\"><i class=\"icon-remove-circle\"></i></td></tr>"  // RESET
		        value_to_print += "<tr class=valid id=\""+id+"_tr\" hidden><td class=\"valid btn\" id=\""+id+"_valid\"><i class=\"icon-ok\"></i></td></tr>"  // VALID
		        value_to_print += "<tr class=cancel id=\""+id+"_tr\" hidden><td class=\"cancel btn\" id=\""+id+"_cancel\"><i class=\"icon-remove\"></i></td></tr>"  // CANCEL
		        value_to_print += "</table></td>";
			    value_to_print += "<td class=content id=\""+id+"_td\">"
			    value_to_print += "<p id=\""+id+"\" class=value>";

				//TODO Redundant : Create function 
		        	var regex_website=/^http[s]?:\/\/\S*$/;
	                	// Start with 'http(s)://' and don't have whitespace after (i.e. no other words)
				if (regex_website.test(entry)){
			    		entry="<a href=\"" + entry + "\" target=\"_blank\">" + entry + "</a>";
				}

			    value_to_print += entry;
			    value_to_print += "</p></td>";
			}
		}
	}
	// Else, entry is (probably) a dict, recall the function
	else{
		value_to_print += "<td class=content colspan=2><table>"
		for (var key in entry) {
			value_to_print += "<tr>"
			value_to_print += val_to_table(key)
			value_to_print += val_to_table(entry[key],id+"___"+key)
			value_to_print += "</tr>"
		}
		//value_to_print += "<tr><td class=new_line id="+id+" colspan=2>➕ New Line</td></tr>" //TODO WIP
		value_to_print += "</table></td>"

	}
	return value_to_print;
}

// -----------------------------------------------------
// GET_DIFF
// --------
// Return difference between two dict

function get_diff(entry){
	var orig_entry=get_stored_entry();
	return diff(entry, orig_entry);
}

// -----------------------------------------------------
// SEARCH_ON_DICT
// TODO DOC

function search_on_dict(entry,tab_pos){
	if (!entry){
		return "value_not_found";
	}
	if(entry[tab_pos[0]]){
		var new_tab_pos=[...tab_pos];
		new_tab_pos.shift();
		if (new_tab_pos.length !== 0){
			return search_on_dict(entry[tab_pos[0]],new_tab_pos);
		}
		else {
			return entry[tab_pos[0]];
		}
	}

}


// -----------------------------------------------------
// SHOW_DIFF
// ---------
// Color differences in the tool table
// 1) Get the differences with master entry
// 2) Search the path of the html element that display the different data
// 3) Add the class 'different' to this element to color it (Cf. CSS)

function show_diff(entry){
	// Get diff
	var differences=get_diff(entry);

	// For each differences
	for (var i in differences) {
		var table_path = differences[i]["path"];
		//Search path of changed element in html
		var path=""
		for (var j in table_path){
			if (path) path += "___"; // Separator of deepness of the json (Cf. print_tool())
			path += table_path[j];
		}
		////path += "_td"; // To change backgrounf color of <td> tag instead of <p>
		//Add the "different" class that will color corresponding background <p> tag
		$('#'+path+"_td").toggleClass('different');
		//$('#'+path).attr('pr_value', differences[i]["lhs"]);
		$('#'+path+"_td").attr('title', differences[i]["rhs"]);
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
		message += dif_num+") Diff in **{"
		var table_path = dif["path"];
		var path=""
		for (var j in table_path){
			if (path) path += "}{"
			path += table_path[j]
		}
		path += "}**";
		message += path + "\n"
		message += "-Orig val : "+dif["rhs"]+"\n";
		message += "-New  val : "+dif["lhs"]+"\n";
		message += "\n";
	}
	return message;
}



// -----------------------------------------------------
//TODO DOC
// SHOW DIFF ET PRINT DIFF???? TODO
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
		////path += "_td"; // To change backgrounf color of <td> tag instead of <p>
		//Add the "different" class that will color corresponding background <p> tag
		$('#'+path).text(difference);
		$('#'+path+'_td').toggleClass('different');
		$('#'+path+'_td').attr('title', String(orig));
		$('#'+path+'_td').attr('pr_value', difference);
	}
}

// -----------------------------------------------------
//TODO DOC
//TODO WIP Reset diff
//TODO callback ?:
function remove_diff(){
	$('.different,.modified_cell').each(function(){
		$(this.firstChild).text($(this).attr('title'));
		$(this).removeClass('different');
		$(this).removeClass('modified_cell');
		$(this).removeAttr('new_value');
		$("#"+this.firstChild.id+"_tr.reset").hide();
	});
}



// -----------------------------------------------------
// EDIT_DICT TODO REMOVE USELESS CAUSE OF STORING JUST DIFF 
// ---------
// Recursive function to add modif made by the user 
// to the dict loaded from the github json.
// In input its take the dict (entry), the current position on the dict (pos),
// the table of position to have the position of the entry if its a complex dict (tab_pos),
// the value to add to the dict (value).
//

function edit_dict(entry,pos,tab_pos,value){
	var new_tab_pos=tab_pos;
	new_tab_pos.shift();
	var new_entry=entry;
	// While we don't arrived to the end of the table we relaunch the function with next pos entry (deeper in the dict) 
	if (new_tab_pos.length != 0) {
		new_entry[pos]=edit_dict(new_entry[pos],tab_pos[0],new_tab_pos,value);
	}
	// Here we arrived to the position to insert the value
	// We insert it and return then the entry modified
	else {
		new_entry[pos]=value;
	}
	return new_entry
}

// -----------------------------------------------------
// EDIT_VALUE 
// ----------
// 
// TODO : If we change a value two time keep the signal that it is new

function edit_value(id){

    // Select the tag with this id
    var $value = $('#'+id);
    var $value_td = $('#'+id+'_td');
    // Get the original value on this tag
    var orig_v = $value.text();
    var default_v = $value_td.attr('title');
    var editted_v = $value_td.attr('new_value') || "" 

    // If there is no title it's mean that the value is the same as the master
    if (!default_v) default_v=orig_v;

    edit_mode(//Callback
    function(){ 
      // Re-select the tag with this id
      var $value = $('#'+id);
      var new_html = ""
 
      // Then, transform the tag to a textarea with the original value
      var $value_td = $('#'+id+"_td");
      var h = $value_td.height();
      //new_html += "<textarea style='width:100%;height:"+h+"pt' id=\""+id+"\" class=value_edit title=\""+default_v+"\" new_value='"+editted_v+"'>"+orig_v+"</textarea>";
      new_html += "<textarea style='width:100%;height:"+h+"pt' id=\""+id+"\" class=value_edit>"+orig_v+"</textarea>";
      $value.replaceWith(new_html);

      $value_td.attr('title',default_v);

      // Change edit (and reset) buttons by valid and cancel (modifications).
		$('tr#'+id+'_tr.edit').hide();
		$('tr#'+id+'_tr.reset').hide();
		$('tr#'+id+'_tr.valid').show();
		$('tr#'+id+'_tr.cancel').show();
	    //var markup = "<tr class=valid id=\""+id+"_tr\"><td class=\"valid btn\" id=\""+id+"_valid\"><i class=\"icon-ok\"></i></td><tr>";
	    //$('table#'+id+'_tab').append(markup);
	    //var markup = "<tr class=cancel id=\""+id+"_tr\"><td class=\"cancel btn\" id=\""+id+"_cancel\"><i class=\"icon-remove\"></i></td><tr>";
	    //$('table#'+id+'_tab').append(markup);

      $('#'+id).keypress(function(event){
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if(keycode == '13'){
	  		valid_edit(id,orig_v);
        }
      });

      $('#'+id+'_valid').unbind('click').on('click', function(event) {
		valid_edit(id,orig_v);
      });
      // Exit modif
      $('#'+id+'_cancel').unbind('click').on('click', function(event) {
		cancel_edit(id);
      });

    });
}



// -----------------------------------------------------
// RESET_VALUE 
// -----------
// 
// TODO : Doc

function reset_value(id){

    // Select the tag with this id
    var $value_td = $('#'+id+'_td');
    // Get the original value on this tag
    var pr_v = $value_td.attr('pr_value') || "";
    var default_v = $value_td.attr('title') || "";
    var reset_v= pr_v || default_v;

	$('#'+id).text(reset_v);
	$('tr#'+id+'_tr.reset').hide();
	$value_td.removeClass('modified_cell');
	$value_td.removeAttr('new_value');
	if ($('.modified_cell').length === 0){
			exit_edit_mode();
	}
}


// -----------------------------------------------------
// EDIT_MODE 
// ---------
// Change to edit mode if it is not already setted

function edit_mode(_cb){
    // If we are not currently on 'edit' mode : create new tab to edit
    if (get_stored_entry("mode") != "edit"){
		store_entry("edit","mode");
        var current_tool = tool_metadata["tab_active"];
        console.log(current_tool +" : edit mode")
        //var edit_tool = "edit_"+current_tool;

	// If we edit the master class we store a table of diff empty
	/* if (current_tool===tool_metadata["name"]) store_entry([],edit_tool); */ //TODO REMOVE
	
	// Else we store the same as the origin PR we want to change
	//else 
		//store_entry(get_stored_entry(current_tool),edit_tool);
		//tool_metadata[edit_tool]=tool_metadata[current_tool];
        //add_tab(edit_tool,"<i class=\"icon-edit\"></i>"+current_tool); //TODO DNT
        //change_tab(edit_tool); //TODO DNT
    }
    _cb();
}

// -----------------------------------------------------
// EXIT_EDIT_MODE
// --------------
// - Change to 'display mode'
// - Hide the edit btns
// - Remove the tab on the menu 

function exit_edit_mode(){
	store_entry("display","mode");
	$('button.edit_mode').hide();//buttons
	//$('#menu li.active').remove();//active tab
	$('.value_edit').each(function(){
		cancel_edit($(this).attr('id'));
	});

}

// -----------------------------------------------------
// VALID_EDIT
// ----------
// TODO DOC

function valid_edit(id,orig_v){

    var entry_id = tool_metadata["tab_active"];
	var entry=get_stored_entry(entry_id);

    var $value_new = $('#'+id);
    var $value_td = $('#'+id+"_td");
    var new_v = $value_new.val();
	var motif =  /___/;
	// Get the position liste of the value from the id (Cf. "val_to_table")
	var liste = id.split(motif);
	var orig_val=$value_td.attr("pr_value") || $value_td.attr("title");

	// If the value is the same from the original
	// We keep original status
	if (orig_val === new_v ){
	    $value_td.removeClass("modified_cell");
	    $value_td.removeAttr('new_value');
	}
	// Else, if the value is found and different
	// we store it and change the status to "new"
	else if (orig_val) {
	    // Retrieve stored entry
            var entry_id = tool_metadata["tab_active"];
            var new_entry_id = entry_id+"_new";

	    // If it is the first time we edit the entry we take the original one
	    if (!get_stored_entry("changes")){
	    	var entry=get_stored_entry(entry_id);
	    }
	    else {
            	var entry=get_stored_entry(new_entry_id);
	    }
	
	    var new_diff={}
	    new_diff["kind"]="E";
	    new_diff["lhs"]= new_v;
	    new_diff["path"]= liste;
	    new_diff["rhs"]= orig_val;
	    entry.push(new_diff);
		
	    // Store it
    	    store_entry(entry,new_entry_id);
		
            // Changes have been made, we record the status to true and show the btn to send changes into PR
	    store_entry(true,"changes");
	    $('button.edit_mode').show();//buttons
	    
	    $value_td.addClass("modified_cell");

	}

	var new_html = "";
    new_html += "<p id=\""+id+"\" class=\"value\"  >"+new_v+"</p>";
    $value_new.replaceWith(new_html);

	$('tr#'+id+'_tr.valid').hide();
	$('tr#'+id+'_tr.cancel').hide();
	$('tr#'+id+'_tr.edit').show();
    if ((orig_val) && (orig_val !== new_v )){
    	$('tr#'+id+'_tr.reset').show();
    	$value_td.attr( "new_value", new_v);
    }

	// Rebind the modif function to the tag
	$('#'+id+'_edit').unbind('click').on('click', function(event) {
    edit_value(this.id.replace('_edit', ''));
    });
	// Rebind the modif function to the tag
	$('#'+id+'_reset').unbind('click').on('click', function(event) {
    reset_value(this.id.replace('_reset', ''));
    });
}


// -----------------------------------------------------
// CANCEL_EDIT
// ----------
// TODO DOC

// TODO HIDE SHOW p and text area...

function cancel_edit(id){

	var value=$('#'+id+'_td').attr("new_value") || ($('#'+id+'_td').attr("pr_value") || $('#'+id+'_td').attr("title")); //TODO REPLACE THE IF WITH THAT


	var new_html = "";
    //new_html += "<p id='"+id+"' class='"+$('#'+id).attr("class")+"'>"+value+"</p>";
    new_html += "<p id='"+id+"'>"+value+"</p>";
    $('#'+id).replaceWith(new_html);

    $('tr#'+id+'_tr.valid').hide();
	$('tr#'+id+'_tr.cancel').hide();
	$('tr#'+id+'_tr.edit').show();
	if ($('#'+id+'_td').attr("new_value")){
    	$('tr#'+id+'_tr.reset').show();
    }

	// Rebind the modif function to the tag
	$('#'+id+'_edit').unbind('click').on('click', function(event) {
    edit_value(this.id.replace('_edit', ''));
    });
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
// TODO : IMprove user experience and error management (learn to use promise)
//

function send_modif(){
	var repo_name=gh_bt_repo;

	// If some changes are not validated don't send
	if ($('.value_edit').length !== 0) {
		alert("Some changes have not been validated");
		var pos = $('.value_edit').offset();
		var top = pos.top - 100;
		var left = pos.left - 20;
		window.scrollTo((left < 0 ? 0 : left), (top < 0 ? 0 : top));
		return;
	}

	// If we are here but no changes have been made don't create a pull request
	if (!get_stored_entry("changes")){
		return;
	}

	// Ask if the user allow the app to fork the repo in his Github account
	var confirm_fork=confirm("If you don't have the repo '"+repo_name+"' forked on your account the app will do it for you. Do you allow it?"); 
	if (!confirm_fork){
		return;
	}

	show_loader();	
	// 1)
		// Get the original Entry
	var entry=get_stored_entry(tool_metadata["name"]);
	// Edit this entry with modifs
	var tab_modif=get_stored_entry(tool_metadata["tab_active"]+"_new");
	for (var m in tab_modif){
		var modif=tab_modif[m];
            	entry = edit_dict(entry,modif["path"][0],modif["path"],modif["lhs"])
	}
	console.log(tool_metadata["tab_active"]+" changes will be recorded");
	// Lower Case id of the tool
	var tool_name = tool_metadata["name"].toLowerCase();
	// File name in which changes will be saved
	var file_name=tool_name+".json";
	// Path of the file in github
	var file_path="data/"+tool_name+"/"+file_name;



	//-----------------------  //TODO attention redondane //TODO MOCHE



	var id = tool_metadata["tab_active"]  //TODO top doublon


	// si pr a sois on remodifie fichier et commit
	console.log("----------------");
	console.log(id);

	if ((tool_metadata[id]) && (tool_metadata[id]['pr_user'] === login)){


		//var branch_name=tool_metadata[id]['pr_branch'];	
		var pr_number=tool_metadata[id]['pr_number'];	
		var my_bt_entry=JSON.stringify(entry, null, " ");
		var body=get_diff_message(entry);


		var branch_origin=tool_metadata[id]['pr_branch'];	
		console.log(id);
		console.log(tool_metadata[id]);
		var branch_name=branch_origin;
		var branch_name=branch_origin+"_up";

		console.log(tool_metadata[id]['pr_branch']);
		console.log("------====--------");
		console.log(login);
		console.log(repo_name);
		console.log(branch_origin);
		console.log(branch_name);
		console.log(file_path);
		//console.log(my_bt_entry);

		var repo_forked = gh.getRepo(login,repo_name);
		console.log(repo_forked);
		console.log("-----2-------");

		repo_forked.createBranch(branch_origin,branch_name,function(req,res){
		//repo_forked.getBranch(branch_name,function(req,res){
				if (!res) {
					alert("Error getting branch '"+branch_name);
					hide_loader();	
					console.log(req);
				}
				else {
					console.log("branch founded");
					console.log(res);
					console.log("----3------");

					//repo_forked.getPullRequest(pr_number,function(req,res){
					//repo_forked.writeFile(branch_name,file_path,my_bt_entry,'Edit '+file_name,{login},function(req,res){
					repo_forked.writeFile(branch_name,file_path,my_bt_entry,'new commit',{},function(req,res){
						if (!res) {
							alert("Error creating file '"+file_name+"' in '"+branch_name+"'");
							hide_loader();	
							console.log(req);
						}
						else {

							console.log(res);
							console.log("###############");

							//repo_forked.getSha(branch_origin, file_path, function(req,resu){
							repo_forked.getSha(branch_name, file_path, function(req,resu){
									var sha_orig=resu['sha'];
									console.log("sha 1");
									console.log(resu);
									repo_forked.getSha(branch_name, file_path, function(req,res){
											var sha_new=res['sha'];
											console.log("sha 2");
											console.log(res);
											repo_forked.commit(sha_orig, sha_new, "commiiit", function(req,res){

												if (!res) {
													alert("Error creating file '"+file_name+"' in '"+branch_name+"'");
													hide_loader();	
													console.log(req);
												}
												else {


													console.log(res);
													console.log("###############");

													console.log("New file writed in https://github.com/"+login+"/"+repo_name+"/tree/"+branch_name+"/"+file_path);
													alert("Pull Request Done!");
													hide_loader();	
													exit_edit_mode();
													var pr_number=res["number"];
													var new_name="NEW_PR_"+pr_number+"_"+tool_name;
													tool_metadata[new_name]={}
													tool_metadata[new_name]['pr_link']=res["html_url"];
													// Store the json entry in memory to manipulate the entry later
													store_entry(entry,id);
													display_new_entry(entry,id);
												}

											});	
									});
							});




							// repo_forked.updatePullRequest(pr_number,{
							// 	 //"title": "Update "+file_name,
						 //  		 //"body": "Please pull this in! [new modif]\n--------------------\n"+body,
						 //  		 "head": login+":"+branch_name,
						 //  		 //"base": "dev"
							// },function(req,res){
							// 	if (!res) {
							// 		alert("Error creating Pull Request from "+login+":"+file_name+" to origin:"+branch_origin);
							// 		hide_loader();
							// 		console.log(req);
							// 	}
							// 	else {
							// 		console.log("New file writed in https://github.com/"+login+"/"+repo_name+"/tree/"+branch_name+"/"+file_path);
							// 		alert("Pull Request Done!");
							// 		hide_loader();	
							// 		exit_edit_mode();
							// 		var pr_number=res["number"];
							// 		var new_name="NEW_PR_"+pr_number+"_"+tool_name;
							// 		tool_metadata[new_name]={}
							// 		tool_metadata[new_name]['pr_link']=res["html_url"];
							// 		// Store the json entry in memory to manipulate the entry later
							// 		store_entry(entry,id);
							// 		display_new_entry(entry,id);

							// 	}
							// });

									
						}
					});


				}
		});
							return;
	}
		////////////////////////////////////
			




	// Current date
	var d = new Date();
        var now=d.getFullYear()  + "-" + (d.getMonth()+1) + "-" +  d.getDate() + "-" + d.getHours() + "-" + d.getMinutes() + "-" + d.getSeconds() + "-" + d.getMilliseconds();
	// Branch name with current date and 'new' tag
	var branch_name="new_"+tool_name+"_"+now;
	// Origin branch in which the Fork and Pull Request will be done
	var branch_origin="dev";
	// Convert the entry to JSON to record it on the json file
	var my_bt_entry=JSON.stringify(entry, null, " ");

	// 2)
	// Fork the repo into registered user github
	repo.fork(function(req,res){
		if (!res) {
			alert("Error creating fork of '"+gh_bt_user+"/"+gh_bt_repo+"' in your Github account");
			hide_loader();	
			console.log(req);
		}
		else {
			// Retrieve then the forked repo
			var repo_forked = gh.getRepo(login,repo_name);
	
			// 3)
			// Create the new branch on the forked repo
			repo_forked.createBranch(branch_origin,branch_name,function(req,res){
				if (!res) {
					alert("Error creating branch '"+branch_name+"' from '"+branch_origin+"'");
					hide_loader();	
					console.log(req);
				}
				else {
	
					// 4)
					// Create the json file on this new branch on the forked repo
					repo_forked.writeFile(branch_name,file_path,my_bt_entry,'Write in '+file_name,{},function(req,res){
						if (!res) {
							alert("Error creating file '"+file_name+"' in '"+branch_name+"'");
							hide_loader();	
							console.log(req);
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
							},function(req,res){
								if (!res) {
									alert("Error creating Pull Request from '"+login+":"+file_name+"' to origin:'"+branch_origin);
									hide_loader();
									console.log(req);
								}
								else {
									console.log("New file writed in https://github.com/"+login+"/"+repo_name+"/tree/"+branch_name+"/"+file_path);
									alert("Pull Request Done!");
									hide_loader();	
									exit_edit_mode();
									var pr_number=res["number"];
									var new_name="NEW_PR_"+pr_number+"_"+tool_name;
									tool_metadata[new_name]={}
									tool_metadata[new_name]['pr_link']=res["html_url"];
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

// -----------------------------------------------------
// ADD_TAB
// -------
// Create a new tab on the menu according to the 'id' provided
// 'value' is printed on the tab and by default is the id 

function add_tab(id){
	var $tab = $('#tab');
    var regex = new RegExp("^(PR|edit|NEW)_[a-zA-Z0-9_-]*$");
	var classs="master";
	var value="Master branch";
	// If it is not the master branch
    if (regex.test(id)){
		classs=id.replace(regex,'$1');
		console.log(tool_metadata)
		console.log(id)
		value="Pull Request n°"+tool_metadata[id]["pr_number"]
	}

	/*
	// If the tool has a Pull Request done by the user add the class 'OWN_PR' to color it differently  // TODO REMOVE?
	if (tool_metadata[id]){
		if (tool_metadata[id]["pr_user"] == login) classs="OWN_PR ";
	}
	*/

	$tab.append("<li id="+id+" class="+classs+"><a>"+value+"</a></li>");
	// Re-add events onclick on the tabs of the menu
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
	console.log("toto")
	add_tab_event();
	// Display tool metadata according to selected tab
	update_header(id);
	// Update id of tab selected
	tool_metadata["tab_active"]=id;
}

// -----------------------------------------------------
// UPDATE_HEADER
// -------------
// Display tool metadatas in header according to selected tab

function update_header(id){

	// JQUERY select elements
	var $title = $('#title');
	//var $bt_link = $('a#bt_link');
	var $subtitle = $('p#subtitle');
	var $subtitle_link = $('a#pr_link');
	var $subtitle_date = $('p#pr_date');
	var $subtitle_author = $('p#pr_author');

	// Change Title
	$title.text(tool_metadata["name"]);
	// Change Bio.tools link (behind title)
	$title.attr("href", "https://bio.tools/"+tool_metadata["name"]);

	// Empty Metadatas
	$subtitle.text("-");
	$subtitle_link.text("-");
	$subtitle_date.text("-");
	$subtitle_author.text("-");


	// Search the status of the entry (Master,Pull request,New or Edit)
	var regex = new RegExp("^([a-zA-Z0-9]*)_[a-zA-Z0-9_-]*$");
	var status = id.replace(regex, '$1');
	var status_converter={"PR":"Pull Request n°","NEW":"New Pull Request","edit":"Edit mode"};
	var status_long=status_converter[status];

	// Display metadatas
	if (tool_metadata[id]){
		var pr_user=tool_metadata[id]['pr_user'];
		var pr_link=tool_metadata[id]['pr_link'];
		var pr_date=tool_metadata[id]['pr_date'];
		var pr_number=tool_metadata[id]['pr_number'];
		// USER that made the Pull Request
		if (pr_user) {
			var you="";
			if (pr_user === login) {
				you = "[you]"
			}
			$subtitle_author.text("By '"+pr_user+"' "+you);

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
// - Print the entry of the selected tab
// - Visual change tab with select_tab() on the selected tab id

function change_tab(id_tab_selected){
	console.log(id_tab_selected+" : selected");
	// Check if its possible to change tab
    //if ((get_stored_entry("mode")=="edit") && (get_stored_entry("changes"))){
//  if ((get_stored_entry("mode")=="edit") && ($('.modified_cell'))){ //TODO WIP
	if ($('.modified_cell').length !== 0){
		var quit=confirm("All modifications will be lost.\n  -Press OK to leave edit mode\n  -Press \"Cancel\" to return to edit mode");
		if (quit) {
			exit_edit_mode();
		}
		else {
			var pos = $('.modified_cell').offset();
			var top = pos.top - 100;
			var left = pos.left - 20;
			window.scrollTo((left < 0 ? 0 : left), (top < 0 ? 0 : top));
			return;
		}
	}
	//else if ((get_stored_entry("mode")=="edit") && (!id_tab_selected.includes('edit'))) {
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
	     	var entry=get_stored_entry(id_tab_selected);

		if (entry){
		// - Print diff and Visual select the tab on menu
			remove_diff();
			print_diff(entry);
			select_tab(id_tab_selected);
		}
		// (Theorical impossible case) 
		else { 
			console.log("Entry" + id_tab_selected + "does not exist"); 
			print_diff(entry);
			select_tab(id_tab_selected);
		}
	}

}

// -----------------------------------------------------
