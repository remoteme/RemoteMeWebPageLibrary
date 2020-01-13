
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
		this.credit=fromJson.credit;
		this.expirationTime=fromJson.expirationTime;
		this.state=fromJson.state;//NO_CREDIT_OR_TIME, INIT, QUEUE, ACTIVE, WEBRTC_TIMEOUT, ERROR_NOPING, USER_EXIT, OWNER_DEACTIVATE;
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


	constructor() {
		GuestController.thiz = this;

		setInterval(thiz=>{
			thiz.ping();
		},1000,this);


		this._componentsDisabled=[];



		this.webGuestLandingWebSocket = new WebSocket(this.getWebGuestLandingWebSocketAddress());
		this.webGuestLandingWebSocket.binaryType = "arraybuffer";
		this.webGuestLandingWebSocket.onmessage = this.onMessageWebGuestLandingWebSocket;


		this._guestInfoChangeListeners = [];
		this._guestStateChangeListeners = [];



		if (guestInfoAtStart == undefined){
			alert("there is no Guest session opened, To test it open link in anymous mode or diffrent browser. Or there is misisng line in script in html 'var guestInfoAtStart = ####guestInfoInit#;' ");
			return;
		}
		this._guestInfo= guestInfoAtStart ;
		console.info(this._guestInfo);
	}


	getGuestInfo(){
		var url ="/api/rest/v1/guest/info/";
		var xhttp = new XMLHttpRequest();

		xhttp.addEventListener("load", function(){
			if (this.status==200){
				this.updateGuestInfo(JSON.parse(this.response));
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
			let guestInfo=JSON.parse(dataJson.dataS);
			GuestController.getInstance().updateGuestInfo(guestInfo);

		}
	}

	updateGuestInfo(dataJson){
		if (typeof dataJson == 'string'){
			dataJson = JSON.parse(dataJson);
		}
		let newOne = new GuestInfo(dataJson);

		let changed = false;

		for(var k in this._guestInfo){
			if (newOne[k]!=this._guestInfo[k]){
				changed=true;
				break;
			}
		};



		if (changed){
			let previous =this._guestInfo;

			this._guestInfo = newOne;
			if (previous!=this._guestInfo.state){
				if (this._guestInfo.state == 'ACTIVE'){
					this.onGuestStateChange(true);
				}else if (previous== 'ACTIVE'){
					this.onGuestStateChange(false);
				}
			}


			this.onGuestInfoChange();
		}

	}


	addComponentDisabled(credit,disable,enable){
		if (credit!= undefined && credit>0){
			var componentDisabled = new ComponentDisabled(credit,disable,enable);
			this._componentsDisabled.push(componentDisabled);
			if ( componentDisabled.getCredit()>this._guestKeyProperties.credit){
				x.disable();
			}
		}
	}

	getCurrentGuestInfo(){
		let temp = new GuestInfo();
		for(var k in this._guestInfo){
			temp[k]=this._guestInfo[k];
		};
		return temp;
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



	//------------ events
	onGuestStateChange(active){
		if (!active){
			RemoteMe.getInstance().disconnectWebSocket(true);
		}else{
			RemoteMe.getInstance().connectWebSocket(true);
		}
		this._guestStateChangeListeners.forEach(f=>f(active));
	}

	onGuestInfoChange(){

		this._componentsDisabled.forEach(componentDisabled=>{
			if (this._guestInfo != undefined && (this._guestInfo.credit()>componentDisabled.getCredit())){
				componentDisabled.disable();
			}else{
				componentDisabled.enable();
			}
		});

		this._guestInfoChangeListeners.forEach(f => f(this.getCurrentGuestInfo()));
	}

	addGuestInfoChangeListener(guestInfo){
		this._guestInfoChangeListeners.push(guestInfo);

		guestInfo(this.getCurrentGuestInfo());
	}
	addGuestStateChangeListener(guestState){
		this._guestStateChangeListeners.push(guestState);

		guestState(this.isActive());
	}

	isActive(){
		return this._guestInfo.state=='ACTIVE';
	}


	chargeDebug(time,credit){
		var url =`/api/rest/v1/guest/chargeDebug/${time}/${credit}/`;
		var xhttp = new XMLHttpRequest();



		xhttp.open("POST", url,true);

		xhttp.send();
	}
}









