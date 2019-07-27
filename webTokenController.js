
var webTokenLandingWebSocket;
var expirationTime=undefined;


window.onload=function () {

	setInterval(function(){
		ping();
	},1000);


	webTokenLandingWebSocket = new WebSocket(getWebTokenLandingWebSocketAddress());
	webTokenLandingWebSocket.binaryType = "arraybuffer";
	webTokenLandingWebSocket.onmessage = onMessageWebTokenLandingWebSocket;
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

	}

}
function updateTimeAndCredit(dataJson){



	RemoteMe.getInstance().setWebPageTokenProperties(new WebPageTokenProperties(dataJson.deviceSessionId,dataJson.expirationTime,dataJson.credit));

}

