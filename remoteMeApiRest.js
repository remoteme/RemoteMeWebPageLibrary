/**
 * return
 * @param deviceId
 * @param onLoad cal with object like: {localIP: "192.168.0.104", port: 80} , or error called with message
 * @constructor
 */
function RemoteMeRest_getLocalWebSocketServer(deviceId,onLoad,onError){
	RemoteMeRest_callRest(`/api/rest/v1/device/localWebSocketServer/${deviceId}/`,"GET",data=>{
		onLoad(data);
	},error=>{
		onError(error);
	});
}

/**
 * return
 * @param deviceId
 * @param onLoad cal with object like: {localIP: "192.168.0.104", port: 80} , or error called with message
 * @constructor
 */
function RemoteMeRest_getLocalWebSocketServers(onLoad,onError){
	RemoteMeRest_callRest(`/api/rest/v1/device/localWebSocketServers/`,"GET",data=>{
		onLoad(data);
	},error=>{
		onError(error);
	});
}


function RemoteMeRest_callRest(url,method,onLoad,onError){

	$.ajax({
		type: method,
		dataType: "json",
		url: url,
		success: function(data){
			onLoad(data);
		},
		error:function(error){
			console.error(`error while calling rest : ${url} status:${error.status}`);
			onError(error.statusText);
		}
	});
}