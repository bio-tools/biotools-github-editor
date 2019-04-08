import GitHub from "github-api";
import Repository from "github-api";
import $ from "jquery";
import bar, { foo } from "./fonctions";

foo()
//bar()

// basic auth
var gh = new GitHub({
  username: 'ValentinMarcon',
  token: 'f1c5eed46fe1e15a7e27dedfb4740350a6602917'
});
var repo = gh.getRepo('ValentinMarcon','TESTAPI');

// /////////////////////////////////////////////////////////



function modif(nom,valeur) {
	var $name_value = $('#name_value');
  	$name_value.text( valeur);
}


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
