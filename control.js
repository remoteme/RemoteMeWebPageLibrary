class Control {


	runFunction(thiz, ignoreIsRunning) {
		if (!thiz.isRunning || ignoreIsRunning) {
			setTimeout(thiz.calculate, 100, thiz);
		}

	}

	setMode(mode, ignoreSteps) {
		if (this.mode != mode) {
			this.counter = 0;
			this.runFunction(this);
			this.mode = mode;

			if (this.prevMode != mode && mode != 0) {
				this.idleCounter = 0;
			}

			if (this.steps > 1 && mode != 0) {
				if (ignoreSteps) {
					console.info("ignore steps");
					this.min = this.minGlobal;
					this.max = this.maxGlobal;
				} else {
					var maxGlobal;
					var max;
					var currentValue;

					if (mode == 1) {
						maxGlobal = this.maxGlobal;
						max = this.max;
						currentValue = this.currentValue;
					} else if (mode == -1) {
						maxGlobal = -this.minGlobal;
						max = -this.min;
						currentValue = -this.currentValue;
					}


					var round = maxGlobal / this.steps;
					var currentStep = Math.trunc((currentValue) / round);
					max = (currentStep + 1) * round;
					max = Math.min(maxGlobal, max);


					if (mode == 1) {
						this.max = max;
						console.info("new max " + max);
					} else if (mode == -1) {
						this.min = -max;
						console.info("new min " + max);
					}
				}

			}


			this.prevMode = mode;
		}

	}

	constructor(min, max, steps, callOnChange) {
		this.isRunning = false;

		this.minGlobal = min;
		this.maxGlobal = max;

		if (steps <= 0) {
			steps = 1;
		}
		this.steps = steps;

		this.min = min / steps;
		this.max = max / steps;

		this.currentValue = 0;
		this.mode = 0;
		this.prevMode = 0;

		this.counter = 0;
		this.idleCounter = 0;


		this.callOnChange = callOnChange;

		this.idleWait = 3;//how log wiat with downing down
		this.accelerate = 4.0;
		this.freeAccelerate = 0.75;
		this.ignoreSteps = false;
	}


	calculate(thiz) {
		thiz.counter++;
		var realCounter = thiz.counter;
		thiz.isRunning = true;


		var newValue = thiz.currentValue;

		if (thiz.mode == 0) {

			if (newValue == 0) {
				thiz.isRunning = false;
			} else {
				if (thiz.idleCounter <= thiz.idleWait) {
					thiz.idleCounter++;
				} else {//powolne zwalnianie
					realCounter -= thiz.idleCounter;
					var mn = newValue < 0 ? -1 : 1;

					newValue *= mn;
					newValue -= thiz.freeAccelerate * realCounter;
					newValue = Math.max(0, newValue);

					newValue *= mn;
				}

			}

		} else {


			if (thiz.mode == 1) {
				if (newValue < 0) {
					newValue = 0;
					thiz.isRunning = false;
				} else {
					newValue += thiz.accelerate * realCounter;
					newValue = Math.min(thiz.max, newValue);
				}
			} else if (thiz.mode == -1) {
				if (newValue > 0) {
					newValue = 0;
					thiz.isRunning = false;
				} else {
					newValue -= thiz.accelerate * realCounter;
					newValue = Math.max(thiz.min, newValue);
				}

			}
		}

		newValue = Math.trunc(newValue);


		if (thiz.currentValue != newValue) {
			thiz.currentValue = newValue;
			if (newValue<0){
				thiz.callOnChange(-newValue/thiz.minGlobal);
			}else{
				thiz.callOnChange(newValue/thiz.maxGlobal);
			}
		}

		if (thiz.isRunning) {
			thiz.runFunction(thiz, true);
		}


	}
}