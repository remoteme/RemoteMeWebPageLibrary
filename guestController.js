
var webGuestLandingWebSocket;
var expirationTime=undefined;

class ComponentDisabled{

	constructor(credit,disable,enable){
		this._credit=credit;
		this._disable=disable;
		this._enable=enable;
		this.enabled=true;
	}

	getCredit(){
		return this._credit;
	}
	enable(){
		if (!this.enabled){
			this.enabled=true;
			this._enable();
		}
	}

	disable(){
		if (this.enabled){
			this.enabled=false;
			this._disable();
		}
	}
}



window.onload=function () {
	GuestController.getInstance();



};

class GuestInfo  {


	getRestTime(){
		return Math.round((this.expirationTime-Date.now())/1000)
	}

	constructor(fromJson){//GuestInfoDto
		this.deviceSessionId=fromJson.deviceSessionId;
		this.credit=fromJson.creditLeft;
		this.expirationTime=fromJson.expirationTime;
		this.state=fromJson.state;
		this.identifier=fromJson.identifier;
	}

	getRestTime(){

	}
}

// Class: RemoteMe
// A Main class to communicate with remoteMe system
class GuestController {

	static getInstance() {
		if (GuestController.thiz == undefined) {
			new GuestController();
		}

		return GuestController.thiz;

	}

	getInfo(){

	}
	constructor() {
		GuestController.thiz = this;

		setInterval(function(){
			ping();
		},1000);


		this._componentsDisabled=[];
		this._guestKeyProperties=undefined;
		this.onGuestChange=[];


		this.webGuestLandingWebSocket = new WebSocket(this.getWebGuestLandingWebSocketAddress());
		this.webGuestLandingWebSocket.binaryType = "arraybuffer";
		this.webGuestLandingWebSocket.onmessage = this.onMessageWebGuestLandingWebSocket;
		this.getGuestAuthentificationInfo();
	}


	getGuestAuthentificationInfo(){
		var url ="/api/rest/v1/guest/info/";
		var xhttp = new XMLHttpRequest();

		xhttp.addEventListener("load", function(){
			if (this.status==200){
				this.updateGuestProperties(JSON.parse(this.response));
			}
		});

		xhttp.open("GET", url,true);

		xhttp.send();
	}

	ping(){
		var url ="/api/rest/v1/guest/ping/";
		var xhttp = new XMLHttpRequest();


		xhttp.open("GET", url,true);

		xhttp.send();
	}


	getWebGuestLandingWebSocketAddress(){
		var ret;
		if (window.location.protocol == 'https:') {
			ret = "wss://";
		} else {
			ret = "ws://";
		}
		ret += window.location.host + "/api/ws/v1/guest/";
		return ret;

	}

	onMessageWebGuestLandingWebSocket(event){
		var dataJson = JSON.parse(event.data);
		if (dataJson.type=="TOKEN_INFO_CHANGE"){
			dataJson=JSON.parse(dataJson.dataS);
			GuestController.getInstance().updateGuestProperties(dataJson);

		}
	}

	updateGuestProperties(dataJson){
		this.setGuestKeyProperties(new GuestKeyProperties(dataJson.deviceSessionId,dataJson.identifier,dataJson.expirationTime,dataJson.credit));
	}


	addComponentDisabled(credit,disable,enable){
		if (credit!= undefined && credit>0){
			var componentDisabled = new ComponentDisabled(credit,disable,enable);
			this._componentsDisabled.push(componentDisabled);
			if (this._guestKeyProperties != undefined && componentDisabled.getCredit()>this._guestKeyProperties.credit){
				x.disable();
			}
		}
	}
	/*disableAllComponent(){
		this._componentsDisabled.forEach(x=>{
			x.disable();
		})
	}

	enableAllComponent(){
		this._componentsDisabled.forEach(x=>{
			x.enable();
		})
	}*/

	setGuestKeyProperties(guestKeyProperties){
		this._guestKeyProperties=guestKeyProperties;
		this._componentsDisabled.forEach(componentDisabled=>{
			if (this._guestKeyProperties != undefined && (componentDisabled.getCredit()>this._guestKeyProperties.credit)){
				componentDisabled.disable();
			}else{
				componentDisabled.enable();
			}
		});

		this.remoteMeConfig.onGuestChange.forEach(f => f(guestKeyProperties));


	}

}









