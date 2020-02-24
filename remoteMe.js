/* Enum: ConnectingStatusEnum
   CONNECTED - Causes the counter to increment normally.
   DISCONNECTED    - Causes the counter to only increment in odd numbers.
   FAILED   - Causes the counter to only increment in even numbers.
   CONNECTING   - Causes the counter to only increment in even numbers.
   DISCONNECTING   - Causes the counter to only increment in even numbers.
   CHECKING   - Causes the counter to only increment in even numbers.
*/
ConnectingStatusEnum = {
	CONNECTED: 0,
	DISCONNECTED: 1,
	FAILED: 2,
	CONNECTING: 3,
	DISCONNECTING: 4,
	CHECKING: 5
};
EventSubscriberTypeEnum = {
	DEVICE_CONNECTION: 0,
	VARIABLE_SCHEDULER_STATE: 50,
	FILE_CHANGE:70
};


class Guard{
	constructor(name,messagesPer3s = 5) {
		this.messagesPer3s=messagesPer3s;
		this.name=name;
		this.counter=0;
		window.setInterval((thiz)=>{
				if (thiz.counter>1.5*thiz.messagesPer3s){

				thiz.counter=Math.floor(1.2*thiz.messagesPer3s);//flood
			}else{

				thiz.counter=0;
			}

		},3000,this)
	}
	clear(){
		this.counter=0;
	}
	check(){

		this.counter++;
		if (this.counter>this.messagesPer3s){
			console.warn(name+`reach maximum in 3 second period period limit is ${this.messagesPer3s}  already send ${this.counter}`);
			return false;
		}else{
			return true;
		}
	}

}



// Class: RemoteMe
// A Main class to communicate with remoteMe system
class RemoteMe {

	static getInstance() {
		if (RemoteMe.thiz == undefined) {
			new RemoteMe();
		}

		return RemoteMe.thiz;

	}

	/*
	Constructor: RemoteMe
	Initializes RemoteMe object based on given configuration

	Parameters:
	config - initial Configuration <RemoteMeConfiguration> can be empty then default configration will be used

	*/
	constructor(config = undefined) {
		if (RemoteMe.thiz != undefined) {
			console.error("Remoteme tried to construct more then once");
			throw "Remoteme tried to construct twice";
		}



		RemoteMe.thiz = this;
		RemoteMe.thiz.messageUserSyncIdToFunction = [];
		var remoteMeDefaultConfig = {
			automaticallyConnectWS: true,
			automaticallyConnectWebRTC: false,
			webSocketConnectionChange: [],
			variableSchedulerStateChange: [],
			deviceConnectionChange:[],
			deviceFileChange:[],
			directConnectionChange: [],
			webRtcConnectionChange: [],
			remoteVideoElementId: "remoteVideo",
			onUserMessage: undefined,
			onUserSyncMessage: undefined,

			pcConfig: {"iceServers": [{"urls": "stun:stun.l.google.com:19302"}]},
			pcOptions: {optional: [{DtlsSrtpKeyAgreement: true}]},
			mediaConstraints: {'mandatory': {'OfferToReceiveAudio': true, 'OfferToReceiveVideo': true}},
		};
		this._reconnectWebSocketAttempts=0;

		this._subscribedEvents=[];

		this.directWebSocket = [];

		this.turnOffWebSocketReconnect=false;

		this.pingWebSocketTimer;
		this.remoteMeConfig;
		this.webSocket;
		this.openedChanel = undefined;
		this.messageCounter = 0;
		this.peerConnection;
		this.variables = undefined;
		this._webSocketGuard=new Guard("websocket send",12);
		this._restGuard=new Guard("rest guard",8);

		this.remoteMeConfig = remoteMeDefaultConfig;
		if (config != undefined) {
			for (var k in config) {
				this.remoteMeConfig[k] = config[k];
			}
		}

		if (this.remoteMeConfig.automaticallyConnectWS) {
			this.connectWebSocket();
			window.setInterval((function () {
				if (!this.isWebSocketConnected() && !this.turnOffWebSocketReconnect && this._reconnectWebSocketAttempts<5){
					this.connectWebSocket();
					this._reconnectWebSocketAttempts++;
				}

			}).bind(this),4000);

		}

		window.onbeforeunload = function (event) {
			this.disconnectWebSocket();
			this.disconnectDirectConnections();
			this.disconnectWebRTC();


		}.bind(this);
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

	subscribeEvent(eventId){
		if (this._subscribedEvents.indexOf(eventId)==-1){
			this._subscribedEvents.push(eventId);
			if (this.isWebSocketConnected()){
				this.sendWebSocket(getEventSubscriberMessage([eventId]));

			}
		}


	}

	getVariables() {
		if (this.variables == undefined) {
			this.variables = new Variables(this);
		}
		return this.variables;
	}

	log(text) {
		var now = (window.performance.now() / 1000).toFixed(3);
		console.log(now + ': ', text);
	}


	logTrace(text) {
			var now = (window.performance.now() / 1000).toFixed(3);
			console.debug(now + ': ', text);
	}


	getWSUrl() {
		var ret;
		if (window.location.protocol == 'https:') {
			ret = "wss://";
		} else {
			ret = "ws://";
		}
		ret += window.location.host + "/api/ws/v1/" + thisDeviceId;
		return ret;

	}

	getRestUrl() {
		return window.location.protocol + "//" + window.location.host + "/api/rest/v1/";

	}

	connectWebSocket() {
		setTimeout(() => this._connectWebSocketNow(), 300);//so everything is registered and ready
		this.webSocketOffManually=false;
	}

	_connectWebSocketNow() {
		this.onWebSocketConnectionChange(ConnectingStatusEnum.CONNECTING);

		this.disconnectWebSocket(false);

		this.webSocket = new WebSocket(RemoteMe.thiz.getWSUrl());
		this.webSocket.binaryType = "arraybuffer";
		this.webSocket.onopen = ((event) => {
			this._reconnectWebSocketAttempts=0;
			this._webSocketGuard.clear();
			this.onWebSocketConnectionChange(ConnectingStatusEnum.CONNECTED);
			if (this.pingWebSocketTimer !== undefined) {
				window.clearTimeout(this.pingWebSocketTimer);
			}
			this.pingWebSocketTimer = setInterval((function () {
				var ret = new RemoteMeData(4);
				ret.putShort(0);
				ret.putShort(0);
				this._webSocketGuard.clear();
				this.sendWebSocket(ret.getBufferArray());
			}).bind(this), 60000);

			if (RemoteMe.thiz.remoteMeConfig.automaticallyConnectWebRTC){
				RemoteMe.thiz.connectWebRTC();
			}
		});

		this.webSocket.onerror = (event) => {
			this.onWebSocketConnectionChange(ConnectingStatusEnum.FAILED);
			this.webSocket.onclose=undefined;//so we dont call it
		}
		this.webSocket.onclose = ((event) => {
			this._webSocketGuard.clear();
			window.clearTimeout(this.pingWebSocketTimer);
			this.pingWebSocketTimer = undefined;
			this.onWebSocketConnectionChange(ConnectingStatusEnum.DISCONNECTED);
		});

		this.webSocket.onmessage = this._onMessageWS.bind(this);



	}


	restartWebSocket() {
		if (this.isWebSocketConnected()) {
			this.disconnectWebSocket(false);
			setTimeout(this.connectWebSocket.bind(this), 1000);
		} else {
			this.connectWebSocket();
		}

	}

	onOffWebSocket() {
		if (this.isWebSocketConnected()) {
			this.disconnectWebSocket();
		} else {
			this.connectWebSocket();
		}

	}


	isWebSocketConnected() {
		return this.webSocket != undefined && this.webSocket.readyState === this.webSocket.OPEN;
	}


	disconnectWebSocket(turnOffWebSocketReconnect=true) {
		if (this.isWebSocketConnected()) {
			this.webSocket.close();
			this.turnOffWebSocketReconnect=turnOffWebSocketReconnect;
		}
		this.webSocket = undefined;

	}

	send(bytearrayBuffer) {
		if (this.isWebSocketConnected()) {
			this.sendWebSocket(bytearrayBuffer);
		} else {
			this.sendRest(bytearrayBuffer);
		}

	}

	sendWebSocket(bytearrayBuffer) {
		if (this._webSocketGuard.check()){
			if (this.isWebSocketConnected()) {
				if (bytearrayBuffer instanceof RemoteMeData) {
					bytearrayBuffer = bytearrayBuffer.getBufferArray();
				}

				this.webSocket.send(bytearrayBuffer);
				return true;
			} else {
				this.log("websocket is not opened");
				return false;
			}
		}
	}


	sendRest(bytearrayBuffer) {
		if (this._restGuard.check()){
			if (bytearrayBuffer instanceof RemoteMeData) {
				bytearrayBuffer = bytearrayBuffer.getBufferArray();
			}
			var url = this.getRestUrl() + "message/sendMessage/";
			var xhttp = new XMLHttpRequest();
			xhttp.responseType = "arraybuffer";
			xhttp.open("POST", url, true);
			xhttp.setRequestHeader("Content-type", "text/plain");

			xhttp.send(bytearrayBuffer);
		}



	}

	sendRestSync(bytearrayBuffer, reponseFunction) {
		if (this._restGuard.check()) {
			var url = this.getRestUrl() + "message/sendSyncMessage/";
			var xhttp = new XMLHttpRequest();
			xhttp.responseType = "arraybuffer";

			xhttp.addEventListener("load", function () {
				if (this.status == 200) {

					reponseFunction(this.response);
				} else {
					console.error("erro while getting sync reponse " + this.statusText);
				}

			});

			xhttp.open("POST", url, true);
			xhttp.setRequestHeader("Content-type", "text/plain");
			xhttp.send(bytearrayBuffer);
		}

	}

	sendUserSyncMessageWebSocket(receiveDeviceId, data, responseFunction) {
		var messageId = Math.floor(Math.random() * 1000000000);
		RemoteMe.thiz.messageUserSyncIdToFunction[messageId] = responseFunction;
		this.sendWebSocket(getUserSyncMessage(receiveDeviceId, thisDeviceId, data, messageId));
	}

	sendUserSyncMessageByFasterChannel(receiveDeviceId, data, responseFunction) {
		if (receiveDeviceId >= 0) {
			if (this.isWebSocketConnected()) {
				this.sendUserSyncMessageWebSocket(receiveDeviceId, data, responseFunction);
			} else {
				this.sendUserSyncMessageRest(receiveDeviceId, data, responseFunction);
			}
		} else {
			console.error("Cannot send message to deviceId with this id, did You configure your script correct ?");
		}
	}

	sendUserSyncMessage(receiveDeviceId, data, responseFunction) {
		return this.sendUserSyncMessageByFasterChannel(receiveDeviceId, data, responseFunction);
	}

	sendWebRTCConnectionStatusChangeMessage(webPageDeviceId, raspberryPiDeviceId, status) {
		this.sendWebSocket(getWebRTCConnectionStatusChangeMessage(webPageDeviceId, raspberryPiDeviceId, status));
	}

	sendWebSocketText(text) {
		if (this.isWebSocketConnected()) {
			this.webSocket.send(text);
			return true;
		} else {
			this.log("websocket is not opened");
			return false;
		}
	}

	sendWebRtc(bytearrayBuffer) {

		if (this.isWebRTCConnected()) {
			if (bytearrayBuffer instanceof RemoteMeData){
				bytearrayBuffer=bytearrayBuffer.getBufferArray();
			}else if (! bytearrayBuffer instanceof  ArrayBuffer){
				bytearrayBuffer=new RemoteMeData(bytearrayBuffer);
				bytearrayBuffer=bytearrayBuffer.getBufferArray();
			}

			this.openedChanel.send(bytearrayBuffer)
		} else {
			this.log("webrtc channels is not opened")
		}

	}


	_onMessageWS(event) {
		if (typeof event.data === 'string' || event.data instanceof String) {

			{
				var ex = false;
				try {
					var dataJson = JSON.parse(event.data);
				}
				catch (e) {
					ex = true;
				}

				if (!ex) {
					if (dataJson["cmd"] == "send") {
						this._doHandlePeerMessage(dataJson["msg"]);
					}
				}
			}
		} else {
			this.processIncommingBinnaryMessage(event.data);
		}


	}


	processIncommingBinnaryMessage(data) {
		var ret = new Object();


		var data = new RemoteMeData(data);

		ret.typeId = data.popInt16();
		if (ret.typeId == MessageType.USER_MESSAGE) {
			ret.size = data.popInt16();
			ret.renevalWhenFailTypeId = data.popByte();
			ret.receiveDeviceId = data.popUint16();
			ret.senderDeviceId = data.popUint16();
			ret.messageId = data.popInt16();

			ret.data = data.popRestBuffer();

			if (this.remoteMeConfig.onUserMessage != undefined) {
				this.remoteMeConfig.onUserMessage(ret.senderDeviceId, ret.data);
			}


		}else if (ret.typeId == MessageType.USER_MESSAGE_GUEST) {
			ret.size = data.popInt16();
			let renevalWhenFailTypeId = data.popByte();
			let receiveDeviceId = data.popUint16();
			let senderDeviceId = data.popUint16();

			let sessionId= remoteMeData.popUint16();
			let identifier= remoteMeData.popUint16();
			let credit= remoteMeData.popUint16();
			let time= remoteMeData.popUint16();


			let data = data.popRestBuffer();

			if (this.remoteMeConfig.onUserMessage != undefined) {
				this.remoteMeConfig.onUserMessage(senderDeviceId, data);
			}


		} else if (ret.typeId == MessageType.USER_SYNC_MESSAGE) {
			let size = data.popInt16();

			let receiveDeviceId = data.popUint16();
			let senderDeviceId = data.popUint16();
			let messageId = data.popInt64();

			let data = data.popRestBuffer();

			this._onUserSyncMessage(senderDeviceId, data, messageId);


		}else if (ret.typeId == MessageType.USER_SYNC_MESSAGE_GUEST) {
			let size = data.popInt16();

			let receiveDeviceId = data.popUint16();
			let senderDeviceId = data.popUint16();

			let sessionId= remoteMeData.popUint16();
			let identifier= remoteMeData.popUint16();
			let credit= remoteMeData.popUint16();
			let time= remoteMeData.popUint16();


			let messageId = data.popInt64();

			let data = data.popRestBuffer();

			this._onUserSyncMessage(senderDeviceId, data, messageId);


		} else if (ret.typeId == MessageType.SYNC_MESSAGE_RESPONSE) {
			ret.size = data.popUint16();

			ret.messageId = data.popInt64();

			ret.data = data.popRestBuffer();

			var functionToCall = RemoteMe.thiz.messageUserSyncIdToFunction[ret.messageId];
			if (functionToCall != undefined) {
				functionToCall(ret.data);
				RemoteMe.thiz.messageUserSyncIdToFunction[ret.messageId] = undefined
			} else {
				console.error(`got reponse message but message id ${ret.messageId} was not recongized`);
			}


		} else if (ret.typeId == MessageType.VARIABLE_CHANGE_PROPAGATE_MESSAGE) {
			this.getVariables()._onObserverPropagateMessage(data);

		}else if (ret.typeId == MessageType.VARIABLE_CHANGE_PROPAGATE_MESSAGE_GUEST) {
			this.getVariables()._onObserverPropagateMessageGuest(data);

		}  else if (ret.typeId == MessageType.VARIABLE_CHANGE_MESSAGE) {
			this.getVariables()._onObserverChangeMessage(data);

		} else if (ret.typeId == MessageType.DEVICE_CONNECTION_CHANGE) {
			let count=data.popUint16()/3;
			while(count-->0){

				let deviceId = data.popUint16();
				let status=data.popByte()==1;
				this.remoteMeConfig.deviceConnectionChange.forEach(x=>{
					x(deviceId,status);
				});
			}

		}else if (ret.typeId == MessageType.DEVICE_FILE_CHANGE) {
			data.popUint16();//take sieze
			let deviceId = data.popUint16();
			let fileName=data.popString();
			this.remoteMeConfig.deviceFileChange.forEach(x=>{
				x(deviceId,fileName);
			});

		}else if (ret.typeId == MessageType.VARIABLE_SCHEDULER_STATE_CHANGE) {
			let count=data.popUint16()/5;
			while(count-->0){

				let variableSchedulerId = data.popUint32();
				let state=data.popByte()==1;
				this.remoteMeConfig.variableSchedulerStateChange.forEach(x=>{
					x(variableSchedulerId,state);
				});
			}

		}


		else if (ret.typeId == 0) {
			//ping
		} else {
			console.error("Message id " + ret.typeId + " was not reconized");
		}


	}


	_onUserSyncMessage(senderDeviceId, data, messageId) {
		if (this.remoteMeConfig.onUserSyncMessage != undefined) {
			let functionRet = this.remoteMeConfig.onUserSyncMessage(senderDeviceId, data);

			let toSend = getUserSyncResponseMessage(messageId, functionRet);
			if (this.isWebSocketConnected()) {
				this.sendWebSocket(toSend);
			} else {
				this.sendRest(toSend);
			}
		} else {
			console.error("Sync message came but no function to handle it");
		}
	}

//--------------- webrtc


	isWebRTCConnected() {
		if ((this.peerConnection == undefined) || (this.openedChanel == undefined)) {
			return false;
		} else {
			return this.peerConnection.iceConnectionState == 'connected';
		}

	}


	restartWebRTC() {
		this._webSocketGuard.clear();
		this.disconnectWebRTC();
		this.connectWebRTC();
	}

	onOffWebRTC() {
		this._webSocketGuard.clear();
		if (this.isWebRTCConnected()) {
			this.disconnectWebRTC();
		} else {
			this.connectWebRTC();
		}
	}

	connectWebRTC() {
		this._webSocketGuard.clear();
		if (!this.isWebSocketConnected()) {
			console.error("websocket is not connected cannot create webrtc connection");
			return;
		}
		if (raspberryPiDeviceId==0) {
			console.error("no raspberrypi device");
			return;
		}
		this.onWebRtcConnectionChange(ConnectingStatusEnum.CONNECTING);

		// No Room concept, random generate room and client id.
		var register = {
			cmd: 'register',
			targetDeviceId: raspberryPiDeviceId
		};
		var register_message = JSON.stringify(register);
		this.sendWebSocketText(register_message);
	}


	doSend(data) {
		var message = {
			cmd: "send",
			msg: data,
			error: "",
			targetDeviceId: raspberryPiDeviceId
		};
		var data_message = JSON.stringify(message);
		if (RemoteMe.thiz.sendWebSocketText(data_message) == false) {
			RemoteMe.thiz.log("Failed to send data: " + data_message);
			return false;
		}

		return true;
	}


	disconnectWebRTC() {

		if (!this.isWebRTCConnected()) {
			console.info("webrtc is not connected cannot disconnect  webrtc connection");
			return;
		}


		this.onWebRtcConnectionChange(ConnectingStatusEnum.DISCONNECTING);

		var message = {
			cmd: "disconnect",
			msg: "",
			error: "",
			targetDeviceId: raspberryPiDeviceId
		};
		var data_message = JSON.stringify(message);
		if (this.sendWebSocketText(data_message) == false) {
			this.log("Failed to send data: " + data_message);
			return false;
		}

		this.openedChanel = undefined;

	}

//PEER conenction


///////////////////////////////////////////////////////////////////////////////
//
// PeerConnection
//
///////////////////////////////////////////////////////////////////////////////

	createPeerConnection() {

		this.peerConnection = new RTCPeerConnection(this.remoteMeConfig.pcConfig, this.remoteMeConfig.pcOptions);
		this.peerConnection.oniceconnectionstatechange = function (event) {
			if (RemoteMe.thiz.peerConnection.iceConnectionState == 'disconnected') {
				RemoteMe.thiz.onWebRtcConnectionChange(ConnectingStatusEnum.DISCONNECTED);
			} else if (RemoteMe.thiz.peerConnection.iceConnectionState == 'failed') {
				RemoteMe.thiz.onWebRtcConnectionChange(ConnectingStatusEnum.FAILED);
			} else if (RemoteMe.thiz.peerConnection.iceConnectionState == 'connected') {
				RemoteMe.thiz.onWebRtcConnectionChange(ConnectingStatusEnum.CONNECTED);
			} else if (RemoteMe.thiz.peerConnection.iceConnectionState == 'checking') {
				RemoteMe.thiz.onWebRtcConnectionChange(ConnectingStatusEnum.CHECKING);
			}

			RemoteMe.thiz.log("webrtc connection status changed" + RemoteMe.thiz.peerConnection.iceConnectionState)
		}
		this.peerConnection.onicecandidate = function (event) {
			if (event.candidate) {
				var candidate = {
					type: 'candidate',
					label: event.candidate.sdpMLineIndex,
					id: event.candidate.sdpMid,
					candidate: event.candidate.candidate
				};
				RemoteMe.thiz.doSend(JSON.stringify(candidate));
			} else {
				RemoteMe.thiz.logTrace("End of candidates.");
			}
		};
		this.peerConnection.onconnecting = this.onSessionConnecting;
		this.peerConnection.onopen = this.onSessionOpened;
		this.peerConnection.ontrack = this.onRemoteStreamAdded;
		this.peerConnection.onremovestream = this.onRemoteStreamRemoved;
		this.peerConnection.ondatachannel = this.onDataChannel;

		this.logTrace("Created RTCPeerConnnection with config: " + JSON.stringify(this.remoteMeConfig.pcConfig));


	}


	onDataChannel(event) {
		RemoteMe.thiz.openedChanel = event.channel;
		RemoteMe.thiz.openedChanel.binaryType = "arraybuffer";

		RemoteMe.thiz.logTrace("on data channel  " + event.channel.label);


		/*event.channel.onclose = function () {
			RemoteMe.thiz.log("on data channel close  ");
			if (RemoteMe.thiz.remoteMeConfig.webRtcConnectionChange) {
				RemoteMe.thiz.remoteMeConfig.webRtcConnectionChange(false);
			}
		};*/
		event.channel.onmessage = function (e) {
			this.log("on Message by webrtc" + e);
			this.processIncommingBinnaryMessage(e.data);
		}.bind(RemoteMe.thiz);
	}


	onRemoteStreamAdded(event) {
		RemoteMe.thiz.logTrace("Remote stream added:", event.streams);
		var remoteVideoElement = document.getElementById(RemoteMe.thiz.remoteMeConfig.remoteVideoElementId);
		remoteVideo.srcObject = event.streams[0];
	}


	sld_success_cb() {
		RemoteMe.thiz.logTrace("setLocalDescription success");
	}


	sld_failure_cb() {
		RemoteMe.thiz.logTrace("setLocalDescription failed");
	}


	aic_success_cb() {
		RemoteMe.thiz.logTrace("addIceCandidate success");
	}


	aic_failure_cb(x) {
		RemoteMe.thiz.logTrace("addIceCandidate failed", x);
	}


	_doHandlePeerMessage(data) {
		++this.messageCounter;
		var dataJson = JSON.parse(data);
		this.logTrace("Handle Message :", JSON.stringify(dataJson));


		if (dataJson["type"] == "offer") {        // Processing offer
			this.logTrace("Offer from PeerConnection");
			var sdp_returned = this.forceChosenVideoCodec(dataJson.sdp, 'H264/90000');
			dataJson.sdp = sdp_returned;
			// Creating PeerConnection
			this.createPeerConnection();
			this.peerConnection.setRemoteDescription(new RTCSessionDescription(dataJson), this.onRemoteSdpSucces, this.onRemoteSdpError);
			this.peerConnection.createAnswer(function (sessionDescription) {

				RemoteMe.thiz.logTrace("Create answer:", sessionDescription);
				RemoteMe.thiz.peerConnection.setLocalDescription(sessionDescription, RemoteMe.thiz.sld_success_cb, RemoteMe.thiz.sld_failure_cb);
				var data = JSON.stringify(sessionDescription);
				RemoteMe.thiz.logTrace("Sending Answer: " + data);
				RemoteMe.thiz.doSend(data);
			}, function (error) { // error
				this.logTrace("Create answer error:", error);
			}, this.remoteMeConfig.mediaConstraints); // type error
		}
		else if (dataJson["type"] == "candidate") {    // Processing candidate
			this.logTrace("Adding ICE candiate " + dataJson["candidate"]);

			var candidate = new RTCIceCandidate({sdpMLineIndex: dataJson.label, candidate: dataJson.candidate});
			this.peerConnection.addIceCandidate(candidate, this.aic_success_cb, this.aic_failure_cb);


		}else{
			this.log("not uncrecongized peer message"+dataJson["type"]);
		}
	}


	onSessionConnecting(message) {
		this.logTrace("Session connecting.");

	}


	onSessionOpened(message) {
		this.logTrace("Session opened.");

	}


	onRemoteStreamRemoved(event) {
		this.logTrace("Remote stream removed.");

	}


	onRemoteSdpError(event) {

		RemoteMe.thiz.onWebRtcConnectionChange(ConnectingStatusEnum.FAILED);

	}


	onRemoteSdpSucces() {
		RemoteMe.thiz.logTrace('onRemoteSdpSucces');

	}


	forceChosenVideoCodec(sdp, codec) {
		return this.maybePreferCodec(sdp, 'video', 'send', codec);
	}


	forceChosenAudioCodec(sdp, codec) {
		return this.maybePreferCodec(sdp, 'audio', 'send', codec);
	}

// Copied from AppRTC's sdputils.js:

// Sets |codec| as the default |type| codec if it's present.
// The format of |codec| is 'NAME/RATE', e.g. 'opus/48000'.


	maybePreferCodec(sdp, type, dir, codec) {
		var str = type + ' ' + dir + ' codec';
		if (codec === '') {
			this.logTrace('No preference on ' + str + '.');
			return sdp;
		}

		this.logTrace('Prefer ' + str + ': ' + codec);	// kclyu

		var sdpLines = sdp.split('\r\n');

		// Search for m line.
		var mLineIndex = this.findLine(sdpLines, 'm=', type);
		if (mLineIndex === null) {
			this.logTrace('* not found error: ' + str + ': ' + codec);	// kclyu
			return sdp;
		}

		// If the codec is available, set it as the default in m line.
		var codecIndex = this.findLine(sdpLines, 'a=rtpmap', codec);
		this.logTrace('mLineIndex Line: ' + sdpLines[mLineIndex]);
		this.logTrace('found Prefered Codec in : ' + codecIndex + ': ' + sdpLines[codecIndex]);
		this.logTrace('codecIndex', codecIndex);
		if (codecIndex) {
			var payload = this.getCodecPayloadType(sdpLines[codecIndex]);
			if (payload) {
				sdpLines[mLineIndex] = this.setDefaultCodec(sdpLines[mLineIndex], payload);
				//sdpLines[mLineIndex] = setDefaultCodecAndRemoveOthers(sdpLines, sdpLines[mLineIndex], payload);
			}
		}

		// delete id 100(VP8) and 101(VP8)

		this.logTrace('** Modified LineIndex Line: ' + sdpLines[mLineIndex]);
		sdp = sdpLines.join('\r\n');
		return sdp;
	}

// Find the line in sdpLines that starts with |prefix|, and, if specified,
// contains |substr| (case-insensitive search).


	findLine(sdpLines, prefix, substr) {
		return this.findLineInRange(sdpLines, 0, -1, prefix, substr);
	}

// Find the line in sdpLines[startLine...endLine - 1] that starts with |prefix|
// and, if specified, contains |substr| (case-insensitive search).


	findLineInRange(sdpLines, startLine, endLine, prefix, substr) {
		var realEndLine = endLine !== -1 ? endLine : sdpLines.length;
		for (var i = startLine; i < realEndLine; ++i) {
			if (sdpLines[i].indexOf(prefix) === 0) {
				if (!substr ||
					sdpLines[i].toLowerCase().indexOf(substr.toLowerCase()) !== -1) {
					return i;
				}
			}
		}
		return null;
	}

// Gets the codec payload type from an a=rtpmap:X line.


	getCodecPayloadType(sdpLine) {
		var pattern = new RegExp('a=rtpmap:(\\d+) \\w+\\/\\d+');
		var result = sdpLine.match(pattern);
		return (result && result.length === 2) ? result[1] : null;
	}

// Returns a new m= line with the specified codec as the first one.


	setDefaultCodec(mLine, payload) {
		var elements = mLine.split(' ');

		// Just copy the first three parameters; codec order starts on fourth.
		var newLine = elements.slice(0, 3);

		// Put target payload first and copy in the rest.
		newLine.push(payload);
		for (var i = 3; i < elements.length; i++) {
			if (elements[i] !== payload) {
				newLine.push(elements[i]);
			}
		}
		return newLine.join(' ');
	}


	setDefaultCodecAndRemoveOthers(sdpLines, mLine, payload) {
		var elements = mLine.split(' ');

		// Just copy the first three parameters; codec order starts on fourth.
		var newLine = elements.slice(0, 3);


		// Put target payload first and copy in the rest.
		newLine.push(payload);
		for (var i = 3; i < elements.length; i++) {
			if (elements[i] !== payload) {

				//  continue to remove all matching lines
				for (var line_removed = true; line_removed;) {
					line_removed = RemoveLineInRange(sdpLines, 0, -1, "a=rtpmap", elements[i]);
				}
				//  continue to remove all matching lines
				for (var line_removed = true; line_removed;) {
					line_removed = RemoveLineInRange(sdpLines, 0, -1, "a=rtcp-fb", elements[i]);
				}
			}
		}
		return newLine.join(' ');
	}


	RemoveLineInRange(sdpLines, startLine, endLine, prefix, substr) {
		var realEndLine = endLine !== -1 ? endLine : sdpLines.length;
		for (var i = startLine; i < realEndLine; ++i) {
			if (sdpLines[i].indexOf(prefix) === 0) {
				if (!substr ||
					sdpLines[i].toLowerCase().indexOf(substr.toLowerCase()) !== -1) {
					var str = "Deleting(index: " + i + ") : " + sdpLines[i];
					this.logTrace(str);
					sdpLines.splice(i, 1);
					return true;
				}
			}
		}
		return false;
	}


//PEER connection closed


// functions for users

	sendUserMessage(receiveDeviceId, data) {
		return this.sendUserMessageByFasterChannel(receiveDeviceId, data);
	}

	sendUserMessageByFasterChannel(receiveDeviceId, data) {
		if (receiveDeviceId >= 0) {
			if (this.isDirectWebSocketConnectionConnected(receiveDeviceId)) {
				this.sendUserMessageDirectWebsocket(receiveDeviceId, data);
			} else if (this.isWebRTCConnected()) {
				this.sendUserMessageWebrtc(receiveDeviceId, data)
			} else if (this.isWebSocketConnected()) {
				this.sendUserMessageWebsocket(receiveDeviceId, data);
			} else {
				this.sendUserMessageRest(receiveDeviceId, data);
			}
		} else {
			console.error("Cannot send message to deviceId with this id, did You configure your script correct ?");
		}
	}




	setautomaticallyConnectWebRTC() {
		if (RemoteMe.thiz.isWebSocketConnected() && RemoteMe.thiz.remoteMeConfig.automaticallyConnectWebRTC==false) {
			setTimeout(() => {
				if (RemoteMe.thiz.remoteMeConfig.automaticallyConnectWebRTC == false && !RemoteMe.thiz.isWebRTCConnected()) {
					RemoteMe.thiz.connectWebRTC();
				}
			},1000);

		}
		RemoteMe.thiz.remoteMeConfig.automaticallyConnectWebRTC = true;

	}

	sendUserMessageWebsocket(receiveDeviceId, data) {
		this.sendWebSocket(getUserMessage(WSUserMessageSettings.NO_RENEWAL, receiveDeviceId, thisDeviceId, 0, data));
	}

	sendUserMessageDirectWebsocket(receiveDeviceId, data) {
		var toSend = getUserMessage(WSUserMessageSettings.NO_RENEWAL, receiveDeviceId, thisDeviceId, 0, data);
		this.sendDirectWebsocket(receiveDeviceId, toSend);

	}

	sendUserMessageWebrtc(receiveDeviceId, data) {
		let sent=false;
		if (GuestController!=undefined){
			var guestController = GuestController.getInstance();
			if (guestController.getInfo()!=undefined){
				this.sendWebRtc(getUserMessageGuestKey(WSUserMessageSettings.NO_RENEWAL, receiveDeviceId,
					thisDeviceId,guestController.getInfo().deviceSessionId,
					guestController.getInfo().identifier,guestController.getInfo().credit,
					guestController.getInfo().getRestTime(), data));
				sent=true;
			}
		}

		if (!sent) {
			this.sendWebRtc(getUserMessage(WSUserMessageSettings.NO_RENEWAL, receiveDeviceId, thisDeviceId, 0, data));
		}
	}

	sendUserMessageRest(receiveDeviceId, data) {
		this.sendRest(getUserMessage(WSUserMessageSettings.NO_RENEWAL, receiveDeviceId, thisDeviceId, 0, data));
	}

	sendUserSyncMessageRest(receiveDeviceId, data, reponseFunction) {
		this.sendRestSync(getUserSyncMessage(receiveDeviceId, thisDeviceId, data), reponseFunction);
	}


	//------------------------ direct websocket




	sendDirectWebsocket(receiveDeviceId, toSend) {
		if (this.isDirectWebSocketConnectionConnected(receiveDeviceId)) {
			if (toSend instanceof RemoteMeData) {
				toSend = toSend.getBufferArray();
			}
			this.directWebSocket[receiveDeviceId].send(toSend);
			console.info(`send to deivcei id ${receiveDeviceId}`);
			return true;
		} else {
			this.log("Directwebsocket is not opened");
			return false;
		}
	}

	isDirectWebSocketConnectionConnected(deviceId) {
		return this.directWebSocket[deviceId] != undefined && this.directWebSocket[deviceId].readyState === this.directWebSocket[deviceId].OPEN;
	}

	directWebSocketConnectionDisconnect(deviceId) {
		if (this.isDirectWebSocketConnectionConnected(deviceId)) {
			this.directWebSocket[deviceId].close();
		}
		this.directWebSocket[deviceId] = undefined;
	}

	disconnectDirectConnections() {
		this.directWebSocket.forEach(x => {
			this.onDirectConnectionChange(x.deviceId, ConnectingStatusEnum.DISCONNECTING);
			x.close()
		});
		this.directWebSocket = [];
	}

	onOffDirectConnection() {
		if (this.directWebSocket.length == 0) {
			this.connectDirectConnection();

		} else {
			this.disconnectDirectConnections();
		}
	}

	getDirectConnectionCount() {
		return this.directWebSocket.length;
	}

	connectDirectConnection() {


		RemoteMeRest_getLocalWebSocketServers(data => {

			//console.info(this);
			data.forEach(device => {
				try {
					this.onDirectConnectionChange(device.deviceId, ConnectingStatusEnum.CONNECTING);
					this.directWebSocket[device.deviceId] = new WebSocket(`ws://${device.localIP}:${device.port}`);
					this.directWebSocket[device.deviceId].binaryType = "arraybuffer";
					this.directWebSocket[device.deviceId].onmessage = (event) => {
						console.info(`direct message got`);
						this._onMessageWS(event);
					};
					this.directWebSocket[device.deviceId].variables = device.variables;


					for (var i = 0; i < this.directWebSocket[device.deviceId].variables.length; i++) {
						var type = this.directWebSocket[device.deviceId].variables[i].type;
						if (isNaN(type)) {
							type = VariableOberverType[type];
						}
						this.directWebSocket[device.deviceId].variables[i].type = parseInt(type);
					}

					this.directWebSocket[device.deviceId].deviceId = device.deviceId;

					this.directWebSocket[device.deviceId].onopen = (event) => this.onOpenDirectConnection(device.deviceId, event);
					this.directWebSocket[device.deviceId].onerror = (event) => this.onDirectConnectionChange(device.deviceId, ConnectingStatusEnum.FAILED);
					this.directWebSocket[device.deviceId].onclose = (event) => this.onDirectConnectionChange(device.deviceId, ConnectingStatusEnum.DISCONNECTED);
				} catch (e) {
					if (location.protocol != 'http:') {
						if (window.confirm("Arduino doesnt support WSS connection and webbrowser will not connect from https.\nYou can at your browser allow to load unsafe content \nClick ok to  redirecting to http. ")) {
							location.href = 'http:' + window.location.href.substring(window.location.protocol.length);
							return;
						}
						this.onDirectConnectionChange(device.deviceId, ConnectingStatusEnum.FAILED);
					}
				}

			});


		}, error => {

			this.onDirectConnectionChange(deviceId, ConnectingStatusEnum.FAILED);
			console.error("Cannot connect local webserver, check if tis enabled at Your arduino")
		});
	}

	onOpenDirectConnection(deviceId, event) {
		console.info(`direct connection opened for deviceid : ${deviceId}`);
		this.directWebSocket[deviceId].send(thisDeviceId + "");
		console.info(`direct connect for device ${deviceId}`);
		this.onDirectConnectionChange(deviceId, ConnectingStatusEnum.CONNECTED);
	}

	onCloseDirectConnection(deviceId, event) {
		console.info(`removed direct conenction for id ${deviceId}`);
		this.directWebSocket.splice(deviceId, 1);
		console.info(this.directWebSocket);
	}



	onDirectConnectionChange(deviceId, status/*:ConnectingStatusEnum*/) {

		console.info(`onDirectConnectionChange ${deviceId}  ${status}`);

		if (typeof this.remoteMeConfig.directConnectionChange == 'function') {
			this.remoteMeConfig.directConnectionChange(status, deviceId);
		} else {
			this.remoteMeConfig.directConnectionChange.forEach(f => f(status, deviceId));
		}


	}

	onWebSocketConnectionChange(status/*:ConnectingStatusEnum*/) {

		setTimeout(() => {
			if (status == ConnectingStatusEnum.CONNECTED && this.variables != undefined) {
				this.getVariables().resendObserve();
			}

			if (status==ConnectingStatusEnum.CONNECTED && this._subscribedEvents.length>0){
				this.sendWebSocket(getEventSubscriberMessage(this._subscribedEvents));
			}

			if (typeof this.remoteMeConfig.webSocketConnectionChange == 'function') {
				this.remoteMeConfig.webSocketConnectionChange(status);
			} else {
				this.remoteMeConfig.webSocketConnectionChange.forEach(f => f(status));
			}
		});


	}

	onWebRtcConnectionChange(status/*:ConnectingStatusEnum*/) {
		if (status==ConnectingStatusEnum.CONNECTED){
			try{
				document.getElementById(RemoteMe.thiz.remoteMeConfig.remoteVideoElementId).play();
			}catch (e) {
				alert("browser stopped auto play, run video manually")
			}
		}

		if (raspberryPiDeviceId != undefined) {
			console.info(`onWebRtcConnectionChange ${thisDeviceId}`);
			if (typeof this.remoteMeConfig.webRtcConnectionChange == 'function') {
				this.remoteMeConfig.webRtcConnectionChange(status);
			} else {
				this.remoteMeConfig.webRtcConnectionChange.forEach(f => f(status));
			}
			this.sendWebRTCConnectionStatusChangeMessage(thisDeviceId, raspberryPiDeviceId, status);
		}
	}


	turnOffGuestRealoadOnStateChange(){
		if (GuestController!=undefined){
			GuestController.getInstance().turnOffGuestRealoadOnStateChange();
		}
	}
	//---------------- EVENTS
	addGuestInfoChangeListener(onChange){
		if (GuestController!=undefined){
			GuestController.getInstance().addGuestInfoChangeListener(onChange);
		}
	}
	addGuestStateChangeListener(onChange){
		if (GuestController!=undefined){
			GuestController.getInstance().addGuestStateChangeListener(onChange);
		}
	}


	addVariableBooleanChangeListener(variableName,onChange){
		this.getVariables().observeBoolean(variableName,onChange);
	}

	addVariableIntegerChangeListener(variableName,onChange){
		this.getVariables().observeInteger(variableName,onChange);
	}

	addVariableTextChangeListener(variableName,onChange){
		this.getVariables().observeText(variableName,onChange);
	}
	addVariableSmallInteger3ChangeListener(variableName,onChange){
		this.getVariables().observeSmallInteger3(variableName,onChange);
	}


	addVariableSmallInteger2ChangeListener(variableName,onChange){
		this.getVariables().observeSmallInteger2(variableName,onChange);
	}
	addVariableIntegerBooleanChangeListener(variableName,onChange){
		this.getVariables().observeIntegerBoolean(variableName,onChange);
	}

	addVariableDoubleChangeListener(variableName,onChange){
		this.getVariables().observeDouble(variableName,onChange);
	}

	addVariableText2ChangeListener(variableName,onChange){
		this.getVariables().observeText2(variableName,onChange);
	}

	addVariableSmallInteger2Text2ChangeListener(variableName,onChange){
		this.getVariables().observeSmallInteger2Text2(variableName,onChange);
	}

}


