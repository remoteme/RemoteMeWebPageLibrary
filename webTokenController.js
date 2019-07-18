


window.onload=function () {

	setInterval(function(){
		ping();
	},1000);

};


function ping(){
	var url ="/inner/tokenLanding/ping/";
	var xhttp = new XMLHttpRequest();


	xhttp.open("GET", url,true);

	xhttp.send();
}



