
var webTokenTimeElement;
var webTokenCreditElement;
var webTokenLandingWebSocket;
var expirationTime=undefined;

window.onload=function () {

	$("body").append("<div id='webTokenMainDiv' class='creditTimeCointainer'><div id='buttonContainer'></div><div class='exitButton' onclick='deactivate(true)'>exit</div></div>");

	var buttonContainer = $("#buttonContainer");
	buttonContainer.append("<div><p class='label'>credit:</p><p id='webTokenCreditElement' class='value'>...</p><p class='end'/></div><div><p class='label'> time: </p><p id='webTokenTimeElement' class='value'>...</p><p class='end'/></div>");
	webTokenCreditElement=buttonContainer.find("#webTokenCreditElement");
	webTokenTimeElement=buttonContainer.find("#webTokenTimeElement");


	webTokenLandingWebSocket = new WebSocket(getWebTokenLandingWebSocketAddress());
	webTokenLandingWebSocket.binaryType = "arraybuffer";
	webTokenLandingWebSocket.onmessage = onMessageWebTokenLandingWebSocket;
//	webTokenLandingWebSocket.onopen =function(){alert('connected');};





	setInterval(function(){
		if (expirationTime!=undefined && expirationTime>0 ){
			expirationTime--;
			webTokenTimeElement.html(fmtMSS(expirationTime));
			ping();
		}
	},1000);
	getWebTokenInfo();




};


function ping(){
	var url ="/inner/tokenLanding/ping/";
	var xhttp = new XMLHttpRequest();


	xhttp.open("GET", url,true);

	xhttp.send();
}

function getWebTokenInfo(){
	var url ="/inner/tokenLanding/getWebTokenInfo/";
	var xhttp = new XMLHttpRequest();

	xhttp.addEventListener("load", function(){
		if (this.status==200){
			updateTimeAndCredit(JSON.parse(this.response));
		}
	});

	xhttp.open("GET", url,true);

	xhttp.send();
}
function deactivate(refirect){
	var r = confirm("Are You sure ?");
	if (r == true) {
		deactivateNow(true);
	}

}

function redirectToTokenLanding() {
	window.location='/#/tokenLanding';
}

function deactivateNow(redirect){
	var url ="/inner/tokenLanding/deactivate/";
	var xhttp = new XMLHttpRequest();

	if (redirect){
		xhttp.addEventListener("load", function(){
			if (this.status==200){
				redirectToTokenLanding();
			}
		});
	}


	xhttp.open("GET", url,true);

	xhttp.send();
}


function exitWebTokenSession(){
	webTokenCreditElement.html(Math.random());
	webTokenTimeElement.html(Math.random());
}

function getWebTokenLandingWebSocketAddress(){
	var ret;
	if (window.location.protocol == 'https:') {
		ret = "wss://";
	} else {
		ret = "ws://";
	}
	ret += window.location.host + "/innerWS/tokenLanding/";
	return ret;

}

function onMessageWebTokenLandingWebSocket(event){
	var dataJson = JSON.parse(event.data);
	if (dataJson.type=="TOKEN_INFO_CHANGE"){
		dataJson=JSON.parse(dataJson.dataS);
		console.info(dataJson);
		updateTimeAndCredit(dataJson);
		if (dataJson.expirationTime==null){
			redirectToTokenLanding();
		}
	}

}
function updateTimeAndCredit(dataJson){
	webTokenCreditElement.html(dataJson.credit);
	expirationTime=dataJson.expirationTime

}

function fmtMSS(s){
	return( s-(s%=60))/60+(9<s?':':':0')+s;
}