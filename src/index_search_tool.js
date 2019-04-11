import GitHub from "github-api";
import Repository from "github-api";
import $ from "jquery";
import bar, { foo } from "./fonctions";
import fs from "fs"; 
import request from "superagent";

var OAUTH = fs.readFileSync('./src/OAUTH', 'utf8');
OAUTH = OAUTH.substring(0, OAUTH.length-1);

foo()
//bar()

// basic auth
var gh = new GitHub({
  username: 'ValentinMarcon',
  token: `${OAUTH}`
  //token: "fdbd207cb03ade61a3f4f318b00be80d2b8bfd90"
});
var repo = gh.getRepo('ValentinMarcon','TESTAPI');

// /////////////////////////////////////////////////////////



function modif(nom,valeur) {
	var $name_value = $('#name_value');
  	$name_value.text( valeur);
}

// ////////////////////

function search_tool(print_tool){
	var $search_tool = $('#search_tool');
	var $tool_name = $search_tool.val()
	console.log($tool_name);
	repo.getContents('master','data/'+$tool_name+'/'+$tool_name+'.json',true, function(req, res) {
	store_entry(res);
	//store_modif([]);
	print_tool(res);	
	});

}

function show_tool(print_tool){
	var $tool_list = $('#tool_list');
	var $tool_name = $tool_list.val()
	console.log($tool_name);
	repo.getContents('master','data/'+$tool_name+'/'+$tool_name+'.json',true, function(req, res) {
	store_entry(res);
	//store_modif([]);
	print_tool(res);	
	});

}



// ////////////////////

function print_tool(entry){
	var $tool_content = $('#tool_content');
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
	var $modifcell = $('p.value');
        $modifcell.on('click', function(event) {
	    modif_value(this.id);
        });
	var $newcell = $('p.new');
        $newcell.on('click', function(event) {
	    alert("you can't add a new value for now");
		//modif_value(this.id);
        });

}


function val_to_table(entry,id=""){
	var value_to_print="";
	if ((entry == "") || (entry == null)){
		var val=""
		if (entry == null){
		  val="null"
		}
		else if (Array.isArray(entry)){
		  val="[]"
		}
		else {
		  val="empty"
		}
		value_to_print += "<td class=\"none\"><p id=\""+id+"\" class=\"new\">"+val+"</p></td>"
	        value_to_print += "<td id=\""+id+"_status\">⚪</td>";
	}
	else if (Array.isArray(entry)){
		value_to_print += "<td><table>";
		for (var key in entry) {
			 value_to_print += "<tr>"
			 value_to_print += val_to_table(entry[key],id+"___"+key)
			 value_to_print += "</tr>"
		}
		value_to_print += "</table></td>";
	}
	else if (typeof entry == "string"){
		if (id == ""){
		    value_to_print += "<td><p class=label>";
		}
		else {
		    value_to_print += "<td id=\""+id+"_td\">"
		    value_to_print += "<p id=\""+id+"\" class=value>";
		}
		value_to_print += entry;
		value_to_print += "</p></td>";
		if (id != ""){
	            value_to_print += "<td id=\""+id+"_status\">🔵</td>";
		}
	}
	else{
		value_to_print += "<td><table>"
		for (var key in entry) {
			value_to_print += "<tr>"
			value_to_print += val_to_table(key)
			value_to_print += val_to_table(entry[key],id+"___"+key)
			value_to_print += "</tr>"
		}
		value_to_print += "<table></td>"

	}
	return value_to_print;
}




// //////////


function modif_dict(entry,pos,tab_pos,value){
	var new_tab_pos=tab_pos;
	new_tab_pos.shift();
	var new_entry=entry;
	if (new_tab_pos.length != 0) {
		new_entry[pos]=modif_dict(new_entry[pos],tab_pos[0],new_tab_pos,value);
	}
	else {
		new_entry[pos]=value;
	}
	return new_entry
}

function modif_value(id){
    var motif =  /___/;
    var liste = id.split(motif);
    var $value = $('#'+id);
    var $v = $value.text();
    var $new_html = ""
    $new_html += "<input type=\"text\" id=\""+id+"\" class=value_edit value=\""+$v+"\">";//</td>";
    $value.replaceWith($new_html);
    var $value_status = $('#'+id+'_status');
    var $new_html = "<td id=\""+id+"_status\">✔️</td>";
    $value_status.replaceWith($new_html);
    var $value_status = $('#'+id+'_status');
    $value_status.on('click', function(event) {
        var $value_new = $('#'+id);
        var $new_v = $value_new.val();
	var $new_html = "";
            $new_html += "<p id=\""+id+"\" class=value >";
            $new_html += $new_v;
            $new_html += "</p>";//</td>";
        $value_new.replaceWith($new_html);
	if ($v != $new_v ){
	    var entry=get_stored_entry();
	    //var liste_modif=Array.from(liste);
            entry = modif_dict(entry,liste[0],liste,$new_v)
    	    store_entry(entry);
	    //var modif_entry=get_stored_modif();
	    //var modif_object = [];
	    //modif_object[liste_modif[0]]=entry[liste_modif[0]];
	    //modif_object=modif_dict(modif_object,liste_modif[0],liste_modif,$v);
            //modif_entry.push(modif_object);
	    //store_modif(modif_entry);
            var new_status = "🆕";
	}
	else {
	    var new_status = "🔵";
	}
        var $value_status = $('#'+id+"_status");
        var $new_html = "";
        $new_html += "<td id=\""+id+"_status\">"+new_status+"</td>";
        $value_status.replaceWith($new_html);
	
        var $modifcell = $('p.value');
	$modifcell.unbind('click').on('click', function(event) {
	    modif_value(this.id);
        });
    });
 }

// ///////////////////////////:


function send_modif(){
	var my_bt_entry=get_stored_entry();
	var tool_name=my_bt_entry['name'];
	var file_name=tool_name+".json";
	var branch_name="new_"+tool_name+"_"+Date.now();
	var branch_to_push="dev";
	my_bt_entry=JSON.stringify(my_bt_entry, null, " ");
	repo.createBranch(branch_to_push,branch_name,function(){
		repo.writeFile(branch_name,file_name,my_bt_entry,'Write in '+file_name,{},function(){
			alert("file writed in https://github.com/ValentinMarcon/TESTAPI/blob/"+branch_name+"/"+file_name);  //catch error...
			repo.createPullRequest({
			  "title": "Update/create "+file_name,
			  "body": "Please pull this in!",
			  "head": branch_name,
			  "base": branch_to_push
			});
		
		});
	});
}

function modif_mode(){
	var $search_table = $('#search_table');
	$search_table.hide();
	var $modif_table = $('#modif_table');
	$modif_table.show();
}

function search_mode(){
	var $search_table = $('#search_table');
	$search_table.show();
	var $modif_table = $('#modif_table');
	$modif_table.hide();
	var $tool_content = $('#tool_content');
	$tool_content.html("");
}



function get_stored_entry(){
	var stored=sessionStorage.getItem("biotools_entry");
	if (stored) return(JSON.parse(stored));
	else alert ("No biotools_entry stored"); // retourner code erreur
}

function store_entry(entry){
	    sessionStorage.setItem('biotools_entry',JSON.stringify(entry));
}

/*
function get_stored_modif(){
	var stored=sessionStorage.getItem("biotools_modif");
	if (stored) return(JSON.parse(stored));
	else alert ("No biotools_modif stored"); // retourner code erreur
}

function store_modif(modif_entry){
	    sessionStorage.setItem('biotools_modif',JSON.stringify(modif_entry));
}
*/

// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


var $btn_search = $('#btn_search');
var $btn_show = $('#btn_show');
var $btn_cancel = $('#btn_cancel');
var $btn_send = $('#btn_send');

$btn_search.on('click', function(event) {
	search_tool(print_tool);
	modif_mode();
});

$btn_show.on('click', function(event) {
	show_tool(print_tool);
	modif_mode();
});

$btn_cancel.on('click', function(event) {
	search_mode();
});

$btn_send.on('click', function(event) {
	send_modif();
});


// //////////////////////////

function fill_tool_list(){
	var $tool_list_obj = $('#tool_list');
	$tool_list_obj.html();
	repo.getContents('master','data',true, function(req, res) {		
		for (var tools in res) {
		    var $tool_name=res[tools]["name"];
		    $tool_list_obj.append("<OPTION>"+$tool_name);
		}
		var $btn_show = $('#btn_show');
		$btn_show.show();
	});
}
fill_tool_list()


// ///////////////////////////////////////////////////////
