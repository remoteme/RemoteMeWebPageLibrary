
var webTokenLandingWebSocket;
var expirationTime=undefined;


window.onload=function () {

	setInterval(function(){
		ping();
	},1000);
/*

	webTokenLandingWebSocket = new WebSocket(getWebTokenLandingWebSocketAddress());
	webTokenLandingWebSocket.binaryType = "arraybuffer";
	webTokenLandingWebSocket.onmessage = onMessageWebTokenLandingWebSocket;
*/


};


function ping(){
	var url ="/inner/tokenLanding/ping/";
	var xhttp = new XMLHttpRequest();


	xhttp.open("GET", url,true);

	xhttp.send();
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
	expirationTime=dataJson.expirationTime

}

