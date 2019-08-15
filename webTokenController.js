
var webGuestLandingWebSocket;
var expirationTime=undefined;


window.onload=function () {

	setInterval(function(){
		ping();
	},1000);


	webGuestLandingWebSocket = new WebSocket(getWebGuestLandingWebSocketAddress());
	webGuestLandingWebSocket.binaryType = "arraybuffer";
	webGuestLandingWebSocket.onmessage = onMessageWebGuestLandingWebSocket;
	getWebTokenInfo();


};


function ping(){
	var url ="/inner/guestLanding/ping/";
	var xhttp = new XMLHttpRequest();


	xhttp.open("GET", url,true);

	xhttp.send();
}

function getWebTokenInfo(){
	var url ="/inner/guestLanding/getWebTokenInfo/";
	var xhttp = new XMLHttpRequest();

	xhttp.addEventListener("load", function(){
		if (this.status==200){
			updateWebTokenProperties(JSON.parse(this.response));
		}
	});

	xhttp.open("GET", url,true);

	xhttp.send();
}




function getWebGuestLandingWebSocketAddress(){
	var ret;
	if (window.location.protocol == 'https:') {
		ret = "wss://";
	} else {
		ret = "ws://";
	}
	ret += window.location.host + "/innerWS/guestLanding/";
	return ret;

}

function onMessageWebGuestLandingWebSocket(event){
	var dataJson = JSON.parse(event.data);
	if (dataJson.type=="TOKEN_INFO_CHANGE"){
		dataJson=JSON.parse(dataJson.dataS);
		console.info(dataJson);
		updateWebTokenProperties(dataJson);

	}

}
function updateWebTokenProperties(dataJson){



	RemoteMe.getInstance().setGuestKeyProperties(new GuestKeyProperties(dataJson.deviceSessionId,dataJson.identifier,dataJson.expirationTime,dataJson.credit));

}

