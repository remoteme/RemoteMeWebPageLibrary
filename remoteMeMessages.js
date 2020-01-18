VariableOberverType= {BOOLEAN:0,INTEGER:1,TEXT:2,SMALL_INTEGER_3:3,SMALL_INTEGER_2:4,INTEGER_BOOLEAN:5,DOUBLE:6,TEXT_2:7,SMALL_INTEGER_2_TEXT_2:8}
ChangeMessageSetting={ NO_RENEWAL:0,RENEWAL_IF_FAILED:1}

MessageType = {USER_MESSAGE:100,USER_MESSAGE_GUEST:108,
	USER_MESSAGE_DELIVER_STATUS:101,
	USER_SYNC_MESSAGE:102,USER_SYNC_MESSAGE_GUEST:109,
	VARIABLE_CHANGE_MESSAGE:103, VARIABLE_CHANGE_PROPAGATE_MESSAGE:104,
	VARIABLE_CHANGE_PROPAGATE_MESSAGE_GUEST:107,

	SEND_PUSH_NOTIFICATION:105,
	SET_VARIABLE_SCHEDULER_STATE:106,
	SYNC_MESSAGE:120, SYNC_MESSAGE_RESPONSE:121,
	OBSERVER_REGISTER_MESSAGE:122,
	REGISTER_DEVICE:200, REGISTER_CHILD_DEVICE:201,
	ADD_DATA:300,

	DEVICE_CONNECTION_CHANGE:301,
	VARIABLE_SCHEDULER_STATE_CHANGE:302,
	DEVICE_FILE_CHANGE:303,

	LOG:20000,
	SYSTEM_MESSAGE:20001,
	WEB_RTC_CONNECTION_CHANGE:20002,
	EVENT_SUBSCRIBER:20003
};

WSUserMessageSettings = { NO_RENEWAL: 0, RENEWAL_IF_FAILED: 1};
AddDataMessageSetting = { NO_ROUND :  0, _1S :  1, _2S :  2, _5S :  3, _10S :  4, _15S :  5, _20S :  6, _30S :  7 };
DeviceType = { NETWORK: 1, SMARTPHONE: 2, WEBPAGE: 3};
LogLevel = { INFO :  1, WARN :  2, ERROR :  3 };
LeafDeviceType = { LD_OTHER :  1, LD_EXTERNAL_SCRIPT :  2 ,LD_SERIAL :  3, LD_NRF24 :  4 , LD_WEB_SOCKET :  5 };

SyncMessageType = { USER : 0,GET_WEBRTC_CONENCTED_DEVICE_ID: 1};

AndroidMessageIcon = {DEFAULT_ICON:1,PERSON_ICON:2,THIEF_ICON:3,WINDOW_OPEN_ICON:4,BUNNY_ICON:5};
AndroidMessageSound= {DEFAULT_SOUND:1};



class RemoteMeData {


	constructor(bufferOrArrayOrLength) {
		this.dataView=getDataView(bufferOrArrayOrLength);
		this.pos=0;
	}

	popFloat32() {
		var ret= this.dataView.getFloat32(this.pos);
		this.pos += 4;
		return ret;
	}


	popFloat64() {
		var ret= this.dataView.getFloat64(this.pos);
		this.pos+=8;
		return ret;

	}


	popDouble() {
		return this.popFloat64();
	}



	popInt8() {
		var ret= this.dataView.getInt8(this.pos);
		this.pos+=1;
		return ret;
	}
	popByte(){
		return this.popInt8();
	}

	popInt16() {
		var ret= this.dataView.getInt16(this.pos);
		this.pos+=2;
		return ret;
	}



	popInt32() {
		var ret= this.dataView.getInt32(this.pos);
		this.pos+=4;
		return ret;
	}


	popInt64() {
		return this.popInt32()*Math.pow(2,32)+this.popInt32();
	}


	popUint8() {
		var ret= this.dataView.getUint8(this.pos);
		this.pos+=1;
		return ret;
	}

	popUint16() {
		var ret= this.dataView.getUint16(this.pos);
		this.pos+=2;
		return ret;
	}


	popString(){
		var data=[];


		do{
			data.push(this.popByte());
		}while (data[data.length-1]!=0);
		data.pop();
		return byteArrayToString(new Uint8Array(data));

	}
	popUint32() {
		var ret= this.dataView.getUint32(this.pos);
		this.pos+=4;
		return ret;
	}


	popArray(size){
		var data =new Uint8Array(this.dataView.buffer,this.pos,size);
		this.pos+=size;
		return getArray(getDataView(data).buffer);
	}
	popRestBuffer(){
		var data =new Uint8Array(this.dataView.buffer,this.pos);
		this.pos=this.size();
		return getDataView(data).buffer;
	}

	putFloat32(number) {
		this.dataView.setFloat32(this.pos,number);
		this.pos+=4

	}

	putFloat64(number) {
		this.dataView.setFloat64(this.pos,number);
		this.pos+=8;
	}

	putDouble(number) {
		this.putFloat64(number);
	}

	putInt8(number) {
		this.dataView.setInt8(this.pos,number);
		this.pos+=1;

	}

	putByte(number) {
		this.putInt8(number);

	}

	putInt16(number) {

		this.dataView.setInt16(this.pos,number);
		this.pos+=2;

	}

	putShort(number){
		this.putInt16(number);
	}

	putInt32(number) {
		this.dataView.setInt32(this.pos,number);
		this.pos+=4;

	}

	putUint8(number) {
		this.dataView.setUint8(this.pos,number);
		this.pos+=1;

	}

	putUint16(number) {
		this.dataView.setUint16(this.pos,number);
		this.pos+=2;

	}

	putUint32(number) {
		this.dataView.setUint32(this.pos,number);
		this.pos+=4
	}

	putLong(number){
		var array=[];
		for ( var index = 0; index < 8; index ++ ) {
			var byte = number & 0xff;
			array [ 8-index-1 ] = byte;
			number = (number - byte) / 256 ;
		}
		this.putArray(array);
	}

	putArray(data) {
		getArray(data).forEach(element=>this.dataView.setInt8(this.pos++,element));
	}


	putString(data){
		this.putArray(getArray(data));
		this.putInt8(0);
	}
	getBufferArray(){
		return this.dataView.buffer;
	}

	getArray(){
		return getArray(this);
	}

	print(){
		console.info(toHexString(new Uint8Array( this.getBufferArray())));
	}

	size(){
		return this.dataView.byteLength;
	}

	rewind(){
		this.pos=0;
	}
}




function getArray(data){
	if (typeof data === 'string' || data instanceof String){
		data=stringToByteArray(data);
	}
	if (data instanceof RemoteMeData){
		data= new Array(... new Uint8Array (data.dataView.buffer));
	}
	if (data instanceof ArrayBuffer){
		data= new Array(... new Uint8Array (data));
	}
	if (data instanceof Uint8Array){
		data= new Array(... data);
	}
	return data;
}

function getDataView(data){
	var dataView;
	if (data instanceof Uint8Array ||  data instanceof Array) {

		dataView = new DataView(new ArrayBuffer(data.length));

		data.map(function(value, i){
			dataView.setUint8(i,value);
		});

	}else if (isNaN(data)){
		dataView = new DataView(data);
	}else{
		dataView = new DataView(new ArrayBuffer(data));
	}
	return dataView;
}

function getUserMessage( userMessageSettings, receiverDeviceId,senderDeviceId, messageId, data) {

	data=getArray(data);


	size=1+2+2+2+data.length;
	var ret = new RemoteMeData(4+size);



	ret.putShort(MessageType.USER_MESSAGE);
	ret.putShort(size);
	ret.putByte(userMessageSettings);
	ret.putShort(receiverDeviceId);
	ret.putShort(senderDeviceId);
	ret.putShort(messageId);
	ret.putArray(data);

	return ret.getBufferArray();

}


function getUserMessageGuestKey( userMessageSettings, receiverDeviceId,senderDeviceId, deviceSessionId,credit,time, data) {

	data=getArray(data);


	size=10+1+data.length;
	var ret = new RemoteMeData(4+size);



	ret.putShort(MessageType.USER_MESSAGE_GUEST);
	ret.putShort(size);
	ret.putByte(userMessageSettings);
	ret.putShort(receiverDeviceId);
	ret.putShort(senderDeviceId);

	ret.putShort(sessionId);
	ret.putShort(credit);
	ret.putShort(time);

	ret.putArray(data);

	return ret.getBufferArray();

}

function getWebRTCConnectionStatusChangeMessage(webPageDeviceId, raspberryPiDeviceId, status) {



	size=2+2+1;
	var ret = new RemoteMeData(4+size);


	ret.putShort(MessageType.WEB_RTC_CONNECTION_CHANGE);
	ret.putShort(size);

	ret.putByte(status);
	ret.putShort(webPageDeviceId);
	ret.putShort(raspberryPiDeviceId);


	return ret.getBufferArray();

}



//getUserMessage(1234,12,[1,2,3,4,5,6]);
//getUserMessage(1234,12,"remotemMe some text");
function getSyncMessage(   receiverDeviceId,senderDeviceId,  data,messageId) {

	data=getArray(data);


	size=2+2+8+data.length;
	var ret = new RemoteMeData(4+size);


	ret.putShort( MessageType.USER_SYNC_MESSAGE);
	ret.putShort(size);
	ret.putShort(receiverDeviceId);
	ret.putShort(senderDeviceId);
	ret.putLong(messageId);
	ret.putArray(data);

	return ret.getBufferArray();
}
//getUserMessage(1234,12,[1,2,3,4,5,6]);
//getUserMessage(1234,12,"remotemMe some text");
function getUserSyncMessage(   receiverDeviceId,senderDeviceId,  data,messageId) {

	data=getArray(data);


	size=2+2+8+data.length;
	var ret = new RemoteMeData(4+size);


	ret.putShort( MessageType.USER_SYNC_MESSAGE);
	ret.putShort(size);
	ret.putShort(receiverDeviceId);
	ret.putShort(senderDeviceId);
	ret.putLong(messageId);
	ret.putArray(data);

	return ret.getBufferArray();
}


function getUserSyncResponseMessage(messageId,   data) {

	data=getArray(data);

	size=8+data.length;
	var ret = new RemoteMeData(4+size);

	ret.putShort(MessageType.SYNC_MESSAGE_RESPONSE);
	ret.putShort(size);

	ret.putLong(messageId);
	ret.putArray(data);

	return ret.getBufferArray();
}

//getLogMessage(LogLevel.INFO,[1,2,3,4,5,6]);
//getLogMessage(LogLevel.DEBUG,"remotemMe some text");
function getLogMessage(level,data){

	data=getArray(data);


	size=2+data.length;
	pos=0;
	var ret = new RemoteMeData(4+size);


	ret.putShort( pos ,  MessageType.LOG);
	ret.putShort(pos,size);
	ret.putByte(pos,level);
	ret.putString(pos,data);


	return ret;
}


function getEventSubscriberMessage(subscribeEvents=[]){
	size=2*subscribeEvents.length;

	var ret = new RemoteMeData(4+size);


	ret.putUint16( MessageType.EVENT_SUBSCRIBER);
	ret.putUint16(size);
	for(let i=0;i<subscribeEvents.length;i++){
		ret.putUint16( subscribeEvents[i]);
	}

	return ret;
}

function getPushNotificationMessage(webPageDeviceId,title,body,badge,icon,image,vibrate=[]){

	title=getArray(title);
	body=getArray(body);
	badge=getArray(badge);
	icon=getArray(icon);
	image=getArray(image);



	size=2 +5+ title.length+ body.length+ image.length+ icon.length+ badge.length+1+vibrate.length;
	pos=0;
	var ret = new RemoteMeData(4+size);


	ret.putUint16( MessageType.SEND_PUSH_NOTIFICATION);
	ret.putUint16(size);
	ret.putUint16( webPageDeviceId);
	ret.putString( title);
	ret.putString( body);
	ret.putString( badge);
	ret.putString( icon);
	ret.putString( image);
	ret.putUint8( vibrate.length);


	for(let i=0;i<vibrate.length;i++){
		ret.putUint8( vibrate[i]/10);
	}


	return ret;
}



function getSetVariableSchedulerStateMessage(status=[]){



	let size= status.length*5;
	let pos=0;
	let ret = new RemoteMeData(4+size);

	ret.putUint16( MessageType.SET_VARIABLE_SCHEDULER_STATE);
	ret.putShort(size);

	for(schedIdAndState of status){
		ret.putUint32(schedIdAndState.variableSchedulerId);
		ret.putUint8(schedIdAndState.state?1:0);
	}


	return ret;
}



//getAddDataMessage(new Date().getTime(),AddDataMessageSetting._5S,[[1,123],[2,0.5]]);
function getAddDataMessage(time,settings,dataSeries){

	size=9+dataSeries.size()*10;
	var ret = new RemoteMeData(size+4);


	ret.putShort(MessageType.ADD_DATA);
	ret.putShort(size);
	ret.putLong(time);
	ret.putByte(settings);

	for (i=0;i<dataSeries.length;i++) {
		var ds=dataSeries[i];
		ret.putShort(ds[0]);
		ret.putDouble(ds[1]);
	}

	return ret.getBufferArray();
}



function stringToByteArray(text){
	return Array.from(new TextEncoder("utf-8").encode(text));
}

function byteArrayToString(byteArray){
	return new TextDecoder("utf-8").decode(byteArray);
}
function toHexString(byteArray) {
	return Array.from(byteArray, function(byte) {
		return ('0' + (byte & 0xFF).toString(16)).slice(-2);
	}).join(' ')
}

function parseHexString(str) {
	var result = [];
	for(i=0;i<str.length;i+=2){
		result.push(parseInt(str.substring(i, i+2), 16));
	}
	return result;
}


