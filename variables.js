class ToSend {
	constructor() {
		this.type = 0;
		this.name = "";
		this.values = [];


	}

	getSize() {
		var ret = 2 + this.name.length + 1;
		switch (this.type) {
			case VariableOberverType.BOOLEAN:
				ret += 1;
				break;
			case VariableOberverType.INTEGER:
				ret += 4;
				break;
			case VariableOberverType.TEXT:
				ret += getArray(this.values[0]).length + 1;
				break;
			case VariableOberverType.SMALL_INTEGER_3:
				ret += 6;
				break;
			case VariableOberverType.SMALL_INTEGER_2:
				ret += 4;
				break;
			case VariableOberverType.INTEGER_BOOLEAN:
				ret += 5;
				break;
			case VariableOberverType.DOUBLE:
				ret += 8;
				break;
			case VariableOberverType.TEXT_2:
				ret += getArray(this.values[0]).length + 1 + getArray(this.values[1]).length + 1;
				break;
			case VariableOberverType.SMALL_INTEGER_2_TEXT_2:
				ret += 4+getArray(this.values[2]).length + 1 + getArray(this.values[3]).length + 1;
				break;

		}
		return ret;
	}

	serialize(remoteMeData) {
		remoteMeData.putShort(this.type);
		remoteMeData.putString(this.name);
		switch (this.type) {
			case VariableOberverType.BOOLEAN:
				remoteMeData.putByte(this.values[0] ? 1 : 0);
				break;
			case VariableOberverType.INTEGER:
				remoteMeData.putInt32(this.values[0]);
				break;
			case VariableOberverType.TEXT:
				remoteMeData.putString(this.values[0]);
				break;
			case VariableOberverType.SMALL_INTEGER_3:
				remoteMeData.putInt16(this.values[0]);
				remoteMeData.putInt16(this.values[1]);
				remoteMeData.putInt16(this.values[2]);

				break;
			case VariableOberverType.SMALL_INTEGER_2:
				remoteMeData.putInt16(this.values[0]);
				remoteMeData.putInt16(this.values[1]);

				break;

			case VariableOberverType.INTEGER_BOOLEAN:
				remoteMeData.putInt32(this.values[0]);
				remoteMeData.putByte(this.values[1] ? 1 : 0);

				break;

			case VariableOberverType.DOUBLE:
				remoteMeData.putDouble(this.values[0]);
				break;

			case VariableOberverType.TEXT_2:
				remoteMeData.putString(this.values[0]);
				remoteMeData.putString(this.values[1]);

				break;
			case VariableOberverType.SMALL_INTEGER_2_TEXT_2:
				remoteMeData.putInt16(this.values[0]);
				remoteMeData.putInt16(this.values[1]);
				remoteMeData.putString(this.values[2]);
				remoteMeData.putString(this.values[3]);

				break;
		}

	}

}

class Variables {


	begin() {
		this.sendNow = false;
	}

	commit() {
		if (this.toSend.length > 0) {
			this._sendNow();
		}
		this.sendNow = true;
	}

	constructor(remoteMe) {
		this.remoteMe = remoteMe;
		this.observables = [];
		this.sendNow = true;
		this.toSend = [];
	}

	_onObserverChangeMessage(remoteMeData){
		remoteMeData.popInt16();//size
		var senderDeviceId = remoteMeData.popInt16();
		var targetDeviceId= thisDeviceId;

		var ignoreCount= remoteMeData.popInt8();
		while(ignoreCount!=0){
			ignoreCount--;
			remoteMeData.popInt16();
		}

		this._onObserverPropagateMessageP(senderDeviceId,targetDeviceId,remoteMeData);
	}

	_onObserverPropagateMessage(remoteMeData){
		remoteMeData.popInt16();//size
		var senderDeviceId = remoteMeData.popInt16();
		var targetDeviceId= remoteMeData.popInt16();
		this._onObserverPropagateMessageP(senderDeviceId,targetDeviceId,remoteMeData);
	}

	_onObserverPropagateMessageP(senderDeviceId,targetDeviceId,remoteMeData) {

		var dataSize = remoteMeData.popInt16();

		for (var i = 0; i < dataSize; i++) {
			var type = remoteMeData.popUint16();
			var name = remoteMeData.popString();
			var toCalls = this.observables[name + type];


			if (toCalls != undefined) {
				var v1;
				var v2;
				var v3;
				var v4;
				if (type == VariableOberverType.BOOLEAN) {
					v1 = (remoteMeData.popByte() == 1);
				} else if (type == VariableOberverType.INTEGER) {
					v1 = (remoteMeData.popInt32());
				} else if (type == VariableOberverType.INTEGER_BOOLEAN) {
					v1 = (remoteMeData.popInt32());
					v2 = remoteMeData.popByte() == 1;
				} else if (type == VariableOberverType.SMALL_INTEGER_2) {
					v1 = remoteMeData.popInt16();
					v2 = remoteMeData.popInt16();
				} else if (type == VariableOberverType.SMALL_INTEGER_3) {
					v1 = remoteMeData.popInt16();
					v2 = remoteMeData.popInt16();
					v3 = remoteMeData.popInt16();
				} else if (type == VariableOberverType.DOUBLE) {
					v1 = remoteMeData.popDouble();
				} else if (type == VariableOberverType.TEXT) {
					v1 = remoteMeData.popString();
				} else if (type == VariableOberverType.TEXT_2) {
					v1 = remoteMeData.popString();
					v2 = remoteMeData.popString();
				} else if (type == VariableOberverType.SMALL_INTEGER_2_TEXT_2) {
					v1 = remoteMeData.popInt16();
					v2 = remoteMeData.popInt16();
					v3 = remoteMeData.popString();
					v4 = remoteMeData.popString();
				} else {
					console.warn(" variable type didnt found if u think its bug contact me contact@remoteme.org");
				}


				for (var j = 0; j < toCalls.length; j++) {
					toCalls[j](v1,v2,v3,v4);
				}

			} else {
				console.warn("ddint found observer with name " + name + " and type" + type);
			}
		}

	}


	setBoolean(name, value) {
		this.set(name, VariableOberverType.BOOLEAN, [value]);
	}

	setInteger(name, value) {
		this.set(name, VariableOberverType.INTEGER, [value]);
	}

	setText(name, value) {
		this.set(name, VariableOberverType.TEXT, [value]);
	}

	setSmallInteger3(name, value, value2, value3) {
		this.set(name, VariableOberverType.SMALL_INTEGER_3, [Math.round(value), Math.round(value2), Math.round(value3)]);
	}

	setSmallInteger2(name, value, value2) {
		this.set(name, VariableOberverType.SMALL_INTEGER_2, [value, value2]);
	}

	setIntegerBoolean(name, value, value2) {
		this.set(name, VariableOberverType.INTEGER_BOOLEAN, [value, value2]);
	}

	setDouble(name, value) {
		this.set(name, VariableOberverType.DOUBLE, [value]);
	}


	setText2(name, value, value2) {
		this.set(name, VariableOberverType.TEXT_2, [value, value2]);
	}
	setSmallInteger2Text2(name, value, value2,value3,value4) {
		this.set(name, VariableOberverType.SMALL_INTEGER_2_TEXT_2, [value, value2,value3,value4]);
	}
	set(name, type, values) {
		var current = new ToSend();
		current.name = name;
		current.type = type;
		current.values = values;
		this.toSend.push(current);

		if (this.sendNow) {
			this._sendNow();
		}

	}

	_sendNow() {


		var ignoreDeviceId = this.remoteMe.getDirectConnected();

		var size = 2 + 2 + 1 + ignoreDeviceId.length * 2;

		for (var current of this.toSend) {
			size += current.getSize();
		}
		var ret = new RemoteMeData(4 + size);
		ret.putShort(MessageType.VARIABLE_CHANGE_MESSAGE);
		ret.putShort(size);
		ret.putShort(thisDeviceId);

		ret.putByte(ignoreDeviceId.length);
		for (var current of ignoreDeviceId) {
			ret.putShort(current);
		}

		var variables=[];
		this.toSend.forEach(x=>{
			var temp={};
			temp.name=x.name;
			temp.type=x.type;
			variables.push(temp);
		});

		ret.putShort(this.toSend.length);

		for (var current of this.toSend) {
			current.serialize(ret);
		}

		this.remoteMe.sendVariablesChangeDirect(variables, ret);

		if (this.remoteMe.isWebRTCConnected()) {
			this.remoteMe.sendWebRtc(ret);
		}

		if (this.remoteMe.isWebSocketConnected()) {
			this.remoteMe.sendWebSocket(ret);
		} else {
			this.remoteMe.sendRest(ret);
		}

		this.toSend = [];


	}

	observeBoolean(name, onChange) {
		this.observe(name, VariableOberverType.BOOLEAN, onChange);
	}

	observeInteger(name, onChange) {
		this.observe(name, VariableOberverType.INTEGER, onChange);
	}


	observeText(name, onChange) {
		this.observe(name, VariableOberverType.TEXT, onChange);
	}

	observeSmallInteger3(name, onChange) {
		this.observe(name, VariableOberverType.SMALL_INTEGER_3, onChange);
	}

	observeSmallInteger2(name, onChange) {
		this.observe(name, VariableOberverType.SMALL_INTEGER_2, onChange);
	}

	observeIntegerBoolean(name, onChange) {
		this.observe(name, VariableOberverType.INTEGER_BOOLEAN, onChange);
	}

	observeDouble(name, onChange) {
		this.observe(name, VariableOberverType.DOUBLE, onChange);
	}

	observeText2(name, onChange) {
		this.observe(name, VariableOberverType.TEXT_2, onChange);
	}
	observeSmallInteger2Text2(name, onChange) {
		this.observe(name, VariableOberverType.SMALL_INTEGER_2_TEXT_2, onChange);
	}

	observe(name, type, onChange) {

		var size = 2 + 2 + 2 + name.length + 1;


		var ret = new RemoteMeData(4 + size);

		ret.putShort(MessageType.OBSERVER_REGISTER_MESSAGE);
		ret.putShort(size);
		ret.putShort(thisDeviceId);
		ret.putShort(1);
		ret.putShort(type);
		ret.putString(name);


		if (this.remoteMe.isWebSocketConnected()) {
			this.remoteMe.sendWebSocket(ret);
		} else {
			this.remoteMe.sendRest(ret);
		}

		if (this.observables[name + type] == undefined) {
			this.observables[name + type] = [];
		}

		this.observables[name + type].push(onChange);
	}


}


