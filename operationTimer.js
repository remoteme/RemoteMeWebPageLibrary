/**
 * you set functino to run
 * then when u are runing multiple through this class the real fiunction will be called not often once per some specific time
 */
class OperationTimer {


	constructor(defaultDelay=200) {
		this.toExecute = [];
		this.executeDelay = [];
		this.timers = [];

		this.defaultDelay = defaultDelay;
	}

	setDelayForFunction(fun, delay) {
		this.executeDelay[fun.name] = delay;
	}


	setDefaultDelay(delay) {
		this.defaultDelay = delay;
	}



	execute(fun, ...parameters) {
		var operationId=fun.name;
		this.executeWithId(operationId,fun,parameters);

	}

	executeWithId(id,fun, ...parameters) {
		var operationId=id;
		if (this.timers[operationId] == undefined) {//for first time we call it immidetly
			fun.apply(undefined, parameters);
			this._setTimeout(this, operationId);// we set timepout but nothing to execute
		} else {
			this.toExecute[operationId] = {'fun': fun,  'parameters': parameters};
		}
	}

	_setTimeout(thiz, operationId) {
		var delayOfCurrent = thiz.executeDelay[operationId];
		if (delayOfCurrent == undefined) {
			delayOfCurrent = thiz.defaultDelay;
		}
		thiz.timers[operationId] = setTimeout(thiz._executeNow, delayOfCurrent,thiz, operationId);
	}

	_executeNow(thiz, operationId) {

		var toExecute = thiz.toExecute[operationId];

		thiz.toExecute[operationId] = undefined;

		if (toExecute != undefined) {
			toExecute.fun.apply(undefined,toExecute.parameters);
			thiz._setTimeout(thiz,operationId);
		} else {
			thiz.timers[operationId] = undefined;//so we call it again after some time of next execituin
		}
	}

}
