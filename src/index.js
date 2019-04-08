import GitHub from "github-api";
import Repository from "github-api";
import $ from "jquery";
import bar, { foo } from "./fonctions";
import fs from "fs"; 

var OAUTH = fs.readFileSync('./src/OAUTH', 'utf8');
OAUTH = OAUTH.substring(0, OAUTH.length-1);
console.log(OAUTH);

foo()
//bar()

// basic auth
var gh = new GitHub({
  username: 'ValentinMarcon',
  token: `${OAUTH}`
});
var repo = gh.getRepo('ValentinMarcon','TESTAPI');

// /////////////////////////////////////////////////////////



function modif(nom,valeur) {
	var $name_value = $('#name_value');
  	$name_value.text( valeur);
}

// ///////

function search_tool(print_tool){
	var $search_tool = $('#search_tool');
	var $tool_name = $search_tool.val()
	console.log($tool_name);
	repo.getContents('master','data/'+$tool_name+'/'+$tool_name+'.json',true, function(req, res) {
	print_tool(res);	
	});

}

function print_tool(entry){
	var $tool_content = $('#tool_content');
	//$tool_content.append("<p>toooooooooooooooooootoooooooooooooooooooooooooo</p>");
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
}


function val_to_table(entry,id=""){
	if (entry == null) {
		return "<td><p id=\""+id+"\">null</p></td>"
	}
	else if (entry == ""){
		if (Array.isArray(entry)){
			return "<td><p id=\""+id+"\">[]</p></td>"
		}
		else {
			return "<td><p id=\""+id+"\"></p></td>"
		}
	}
	var value_to_print="";
	if (Array.isArray(entry)){
		value_to_print += "<td><table>";
		for (var key in entry) {
			 value_to_print += "<tr>"
			 //value_to_print += val_to_table(key)
			 value_to_print += val_to_table(entry[key],id+"_"+key)
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
			value_to_print += val_to_table(entry[key],id+"_"+key)
			value_to_print += "</tr>"
		}
		value_to_print += "<table></td>"

	}
	//console.log(value_to_print);
	return value_to_print;
}

function modif_value(id){
    console.log(id);
    var $value = $('#'+id);
    var $v = $value.text();
    var $value_td = $('#'+id+"_td");
    console.log($v);
    var $new_html = ""
	$new_html += "<td id=\""+id+"_td_modif\">";
	$new_html += "<input type=\"text\" id=\""+id+"\" class=value_edit value=\""+$v+"\"></td>";
    $value_td.replaceWith($new_html);
    var $value_status = $('#'+id+'_status');
	$new_html += "<td id=\""+id+"_status\"> ✔️ </td>";
    $value_status.replaceWith($new_html);
    var $value_new = $('#'+id);
    var $value_status = $('#'+id+'_status');
    $value_status.on('click', function(event) {
	console.log("tutu");
	var $v = $value_new.val();
        var $value_td = $('#'+id+'_td_modif');
        console.log($v);
        var $new_html = "";
	    $new_html += "<td id=\""+id+"_td\">";
	    $new_html += "<p id=\""+id+"\" class=value >";
	    $new_html += $v;
	    $new_html += "</p></td>";
	$value_td.replaceWith($new_html);
	var $value_status = $('#'+id+"_status");
	    var $new_html = "";  
		$new_html += "<td id=\""+id+"_status\">🆕</td>";
	$value_status.replaceWith($new_html);
/*$name_value.text($v);
	$name_value_edit.hide();
	$name_validate.hide();*/
	var $modifcell = $('p.value');
        $modifcell.on('click', function(event) {
	    modif_value(this.id);
        });
    });
   
}



// ///////////////////////////:


var $btn_search = $('#btn_search');
$btn_search.on('click', function(event) {
	search_tool(print_tool);
});

var $modifcell = $('p.value');
$modifcell.on('click', function(event) {
    modif_value(this.id);
});




// ////////////////////////////////////////////////////////

repo.getContents('master','affypipe.json',true, function(req, res) {
console.log(res);
console.log(res["name"]);
modif("nom",res["name"]);
});



var $name_value = $('#name_value');
var $name_value_edit = $('#name_value_edit');
//var $name_edit = $('#name_edit');
var $name_validate = $('#name_validate');
$name_value.on('click', function(event) {
    console.log("toto");
    var $v = $name_value.text();
    console.log($v);
    $name_value_edit.show();
    $name_value_edit.val($v)
//    $name_edit.hide();
    $name_value.hide();
    $name_validate.show();
});

$name_validate.on('click', function(event) {
    console.log("tutu");
    var $v = $name_value_edit.val();
    console.log($v);
    $name_value.text($v);
//    $name_edit.show();
    $name_value.show();
    $name_value_edit.hide();
    $name_validate.hide();
});


var $send_modif = $('#send_modif');

$send_modif.on('click', function(event) {
    repo.writeFile('dev','affypipe.json',$name_value.text(),'modif affypipe.json',{});
    alert($name_value.text() + " sendt to github");
});


// ///////////////////////////////////////////////////////

var $test = $('#test');
var $test_value = $('#test_value');

$test.on('click', function(event) {
  var date = new Date(event.timeStamp);
  $test_value.text( "You clik at " + date);
});



//repo.writeFile('master','README.md','## HELLO there2','test write in existing file',{})
//$("div.foo").attr()
