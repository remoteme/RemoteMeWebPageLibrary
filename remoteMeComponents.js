var id = 0;
var otChange200 = new OperationTimer(200);


function getProportional(min, max, x) {
	return (min + max + x * (max - min)) / 2;
}

function nicePrint(x) {
	return (x >= 0 ? "&nbsp;" : "") + parseFloat(x).toFixed(2);
}

$.fn.extend({
	animateCss: function (animationName, infinitive = false, callback) {
		if (this.clean != undefined) {
			this.clean();
		}

		var animationEnd = (function (el) {
			var animations = {
				animation: 'animationend',
				OAnimation: 'oAnimationEnd',
				MozAnimation: 'mozAnimationEnd',
				WebkitAnimation: 'webkitAnimationEnd',
			};

			for (var t in animations) {
				if (el.style[t] !== undefined) {
					return animations[t];
				}
			}
		})(document.createElement('div'));

		var classToAdd = 'animated ' + animationName + (infinitive ? ' animation-iteration-count: infinite' : '');
		this.clean = () => {
			$(this).removeClass(classToAdd);
			this.clean = undefined;
		};

		this.addClass(classToAdd).one(animationEnd, function () {
			$(this).removeClass(classToAdd);
			if (typeof callback === 'function') callback();
		});

		return this;
	},
});


class TwoWayMapper {

	constructor() {
		this.keys = [];
		this.reverseKeys = [];

		this.normal = [];
		this.reverse = [];
	}

	add(key1, key2) {
		this.normal[key1] = key2;
		this.reverse[key2] = key1;

		if (this.keys.indexOf(key1) == -1) {
			this.keys.push(key1)
		}

		if (this.reverse.indexOf(key2) == -1) {
			this.reverse.push(key2)
		}
	}

	get(key) {
		return this.normal[key1];
	}

	getReverse() {
		return this.reverse[key];
	}

	getKeys() {
		return this.keys;
	}

	getReverseKeys() {
		return this.reverseKeys;
	}
}

class Gyroscope {

	constructor(xMin, xMax, yMin, yMax, xRange, yRange, xySwap, orientationSupport, onMove) {
		var thiz = this;

		this.on = false;

		this.onMove = onMove;
		this.xMin = xMin;
		this.xMax = xMax;
		this.yMin = yMin;
		this.yMax = yMax;
		this.xRange = xRange;
		this.yRange = yRange;
		this.xySwap = xySwap;
		this.orientationSupport = orientationSupport;


		const deg2rad = Math.PI / 180; // Degree-to-Radian conversion
		this.previousRotMat = undefined;

		this.inverseMat;
		this.currentRotMat;
		this.relativeRotationDelta;


		window.addEventListener("deviceorientation", function (e) {
			if (thiz.on) {
				// init values if necessary
				let alpha = e.alpha;
				let beta = e.beta;
				let gamma = e.gamma;


				if (thiz.checkDiff(alpha, beta, gamma)) {
					if (!thiz.previousRotMat) {
						thiz.previousRotMat = glMatrix.mat3.create();
						thiz.currentRotMat = glMatrix.mat3.create();
						thiz.relativeRotationDelta = glMatrix.mat3.create();
						thiz.inverseMat = glMatrix.mat3.create();
						thiz.fromOrientation(thiz.currentRotMat, alpha * deg2rad, beta * deg2rad, gamma * deg2rad);

						// save last orientation
						glMatrix.mat3.copy(thiz.previousRotMat, thiz.currentRotMat);
						// get rotation in the previous orientation coordinate
					}

					thiz.fromOrientation(thiz.currentRotMat, alpha * deg2rad, beta * deg2rad, gamma * deg2rad);

					glMatrix.mat3.transpose(thiz.inverseMat, thiz.previousRotMat); // for rotation matrix, inverse is transpose


					glMatrix.mat3.multiply(thiz.relativeRotationDelta, thiz.currentRotMat, thiz.inverseMat);

					// add the angular deltas to the cummulative rotation
					let x1 = Math.asin(thiz.relativeRotationDelta[6]) / deg2rad;
					let x2 = Math.asin(thiz.relativeRotationDelta[7]) / deg2rad;

					thiz.onMoveEvent(x1, x2);
				}


			}

		});

	}

	checkDiff(alpha, beta, gamma) {
		if (this.lastSend == undefined) {

			this.lastAlpha = 1000;
			this.lastBeta = 1000;
			this.lastGamma = 1000;
			this.lastSend = 0;
		}


		let diff1 = Math.abs(this.lastAlpha - alpha);
		let diff2 = Math.abs(this.lastBeta - beta);
		let diff3 = Math.abs(this.lastGamma - gamma);


		let now = new Date().getTime();
		if ((now - this.lastSend > 1000) || diff1 > 2 || diff2 > 2 || diff3 > 2) {
			this.lastAlpha = alpha;
			this.lastBeta = beta;
			this.lastGamma = gamma;
			this.lastSend = now;
			return true;
		} else {
			return false;
		}


		/*	this.lastAlpha=1000;
			this.lastBeta=1000;
			this.lastGamma=1000;*/

	}

	normalize(a) {
		var zn = 1;
		if (a < 0) {
			zn = -1;
		}
		return zn * Math.pow(Math.abs(a) / 5, 2);
	}

	reset() {
		this.previousRotMat = undefined;
		this.onMoveEvent(0, 0);
	}

	onMoveEvent(x, y) {
		if (this.xySwap) {
			let temp = x;
			x = y;
			y = temp;
		}

		if (this.orientationSupport) {
			if (window.innerHeight < window.innerWidth) {
				let temp = x;
				x = y;
				y = temp;
			}
		}


		x = this.normalize(x);
		y = this.normalize(y);


		x = x / this.xRange;
		y = y / this.yRange;
		x = Math.min(1, Math.max(x, -1));
		y = Math.min(1, Math.max(y, -1));


		this.onMove(Math.round(getProportional(this.xMin, this.xMax, x)),
			Math.round(getProportional(this.yMin, this.yMax, y)),
			x, y);
	}


	enable(enabled) {
		this.reset();
		this.on = enabled;
	}

	onOff() {
		if (this.on) {
			this.enable(false);
			return false;
		} else {
			this.enable(true);
			return true;
		}
	}

	fromOrientation(out, alpha, beta, gamma) {
		let _z = alpha;
		let _x = beta;
		let _y = gamma;

		let cX = Math.cos(_x);
		let cY = Math.cos(_y);
		let cZ = Math.cos(_z);
		let sX = Math.sin(_x);
		let sY = Math.sin(_y);
		let sZ = Math.sin(_z);

		out[0] = cZ * cY + sZ * sX * sY,    // row 1, col 1
			out[1] = cX * sZ,                   // row 2, col 1
			out[2] = -cZ * sY + sZ * sX * cY , // row 3, col 1

			out[3] = -cY * sZ + cZ * sX * sY,  // row 1, col 2
			out[4] = cZ * cX,                   // row 2, col 2
			out[5] = sZ * sY + cZ * cY * sX,    // row 3, col 2

			out[6] = cX * sY,                   // row 1, col 3
			out[7] = -sX,                      // row 2, col 3
			out[8] = cX * cY                    // row 3, col 3
	};


}


class Touch {

	constructor(selector, xMin, xMax, yMin, yMax, onMove) {
		this.disabled=false;

		this.onMoveReal = onMove;
		this.xMin = xMin;
		this.xMax = xMax;
		this.yMin = yMin;
		this.yMax = yMax;

		this.move = false;

		let clazz = "steerParent";
		if ($(selector).attr("class") != undefined) {
			clazz += " " + $(selector).attr("class");
			$(selector).removeAttr("class");
		}

		this.steerParent = $(`<div class="${clazz}"></div>`);
		this.pointer = $(`<div class="steer" ></div>`);
		this.text = $(`<div class="text" ></div>`);
		this.steerParent.append(this.pointer);
		this.steerParent.append(this.text);

		if ($(selector).attr("style") != undefined) {
			this.steerParent.attr("style", $(selector).attr("style"));
			$(selector).removeAttr("style");
		}

		selector.replaceWith(this.steerParent[0]);

		this.steerParent.touchElement = this;

		var onTouchStart = e => {
			if (!this.disabled) {
				var touch = e.data;
				touch.move = true;
				var touchEvent = touch.getTouchEvent(e);

				var top = touchEvent.pageY - touch.steerParent.offset().top;
				var left = touchEvent.pageX - touch.steerParent.offset().left;


				touch.deltaOffsetX = touchEvent.clientX;
				touch.deltaOffsetY = touchEvent.clientY;


				touch.steerParent.addClass('active');

				touch.pointer.css('top', top - touch.pointer.height() / 2 + "px");
				touch.pointer.css('left', left - touch.pointer.width() / 2 + "px");
				touch.onMove(0, 0);
			}
		};


		var onTouchEnd = (e) => {
			var touch = e.data;
			touch.move = false;

			touch.steerParent.removeClass('active');

			touch.steerParent.css('top', '');
			touch.steerParent.css('left', '');
			touch.pointer.css('background-color', '');

			touch.pointer.css('top', touch.steerParent.height() / 2 - touch.pointer.height() / 2 + "px");
			touch.pointer.css('left', touch.steerParent.width() / 2 - touch.pointer.width() / 2 + "px");

			touch.onMove(0, 0);
		};
		var onTouchMove = e => {
			if (!this.disabled) {
				e.preventDefault();
				var touch = e.data;

				if (touch.move) {
					var touchEvent = touch.getTouchEvent(e);

					var top = touchEvent.pageY - touch.steerParent.offset().top;
					var left = touchEvent.pageX - touch.steerParent.offset().left;

					touch.pointer.css('top', top - touch.pointer.height() / 2 + "px");
					touch.pointer.css('left', left - touch.pointer.width() / 2 + "px");

					var xposition = -(touch.deltaOffsetX - touchEvent.clientX) / (touch.steerParent.width() / 2);
					var yposition = (touch.deltaOffsetY - touchEvent.clientY) / (touch.steerParent.height() / 2);

					xposition = touch.range(xposition);
					yposition = touch.range(yposition);

					touch.onMove(xposition, yposition);
				}
			}

		};


		this.steerParent.on('touchstart', this, onTouchStart);
		this.steerParent.on('mousedown', this, onTouchStart);

		this.steerParent.on('touchend', this, onTouchEnd);
		this.steerParent.on('mouseup', this, onTouchEnd);

		this.steerParent.on('touchmove', this, onTouchMove);
		this.steerParent.on('mousemove', this, onTouchMove);


	}


	disable(disabled = true) {
		this.disabled=disabled;
		if (disabled){
			$(this.pointer).addClass("disabled");
		}else{
			$(this.pointer).removeClass("disabled");

		}
	}

	onMove(x, y) {
		if (!this.disabled){
			x = Math.round(getProportional(this.xMin, this.xMax, x));
			y = Math.round(getProportional(this.yMin, this.yMax, y));

			if (x == 0 && y == 0) {
				this.text.text("");
			} else {
				this.text.html(this.toFixes(x, this.xMin, this.xMax) + " " + this.toFixes(y, this.yMin, this.yMax));
			}

			if (this.onMoveReal != undefined) {
				this.onMoveReal(x, y);
			}
		}

	}

	range(number) {
		if (number < -1) {
			return -1;
		} else if (number > 1) {
			return 1;
		} else {
			return number;
		}
	}

	getTouchEvent(e) {

		if (e.changedTouches == undefined) {//probably mouses
			return e;
		}
		if (e.changedTouches.length == 1) {
			return e.changedTouches[0];
		}
		for (var i = 0; i < e.changedTouches.length; i++) {
			if (e.changedTouches[i].target == this.steerParent[0]) {
				return e.changedTouches[i];
			}
		}
	}

	toFixes(i, min, max) {
		let leadingZeros = Math.log(Math.max(Math.abs(min), Math.abs(max))) * Math.LOG10E + 1 | 0;

		let space = "";
		if (min < 0 && i >= 0) {
			space = "&nbsp;";
		}

		let retX = "" + Math.abs(i);

		while (leadingZeros > retX.length) {
			space = space + "&nbsp;";
			leadingZeros--;
		}


		return space + i;
	}

	getCartesianDiff(p1, p2) {
		return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2))
	}
}


var multiSwitchUID = 0;

class MultiSwitch {


	constructor(selector, label, items, onMainChangeEvent, onSingleChangeEvent) {
		this.id = "multiSwitchUID" + (multiSwitchUID++);
		this.onMainChangeEvent = onMainChangeEvent;
		this.onSingleChangeEvent = onSingleChangeEvent;

		this.count = 0;


		this.container = $(`<div class="mdl-textfield mdl-js-textfield getmdl-extend">

        <label class="mdl-switch mdl-js-switch mdl-js-ripple-effect main-switch" for="main-switch_${this.id}">
            <input type="checkbox" id="main-switch_${this.id}" class="mdl-switch__input" checked>
            <span class="mdl-switch__label" >${label}</span>
        </label>

        <i class="mdl-icon-toggle__label material-icons"  id="arrow_${this.id}">keyboard_arrow_down</i>

        <ul for="arrow_${this.id}" class="mdl-menu mdl-menu--bottom-right mdl-js-menu">

        </ul>
    </div>`);

		this.mainCheckBoxElement = this.container.children("label");

		let checkbox = this.mainCheckBoxElement.children("input");

		var thiz = this;

		checkbox.change(function () {
			setTimeout(thiz.onMainChange.bind(thiz), 0);

		});


		this.checkBoxElements = [];

		selector.replaceWith(this.container[0]);


		for (let i = 0; i < items.length; i++) {
			this.count++;
			let itemId = this.id + "_" + i;

			let checkBoxElement = $(` <li class="mdl-menu__item" >
                <label class="mdl-switch mdl-js-switch mdl-js-ripple-effect" for="switch_${this.id}_${itemId}" >
                    <input type="checkbox" id="switch_${this.id}_${itemId}" class="mdl-switch__input" checked>
                    <span class="mdl-switch__label">${items[i]}</span>
                </label>
            </li>`);

			this.checkBoxElements.push(checkBoxElement.children("label"));

			let checkbox = this.checkBoxElements[i].children("input");

			this.container.children('.mdl-menu').append(checkBoxElement);

			checkbox.change(function () {
				setTimeout(thiz.onSingleItemChange.bind(thiz), 0, i);

			});
			componentHandler.upgradeElement(this.checkBoxElements[i][0]);


		}


		componentHandler.upgradeElement(this.mainCheckBoxElement[0]);
		componentHandler.upgradeElement(this.container[0]);
		componentHandler.upgradeElement(this.container.children(".mdl-icon-toggle__label")[0]);
		componentHandler.upgradeElement(this.container.children(".mdl-menu")[0]);
	}

	isItemSelected(id) {
		return this.checkBoxElements[id].is('.is-checked');
	}

	isMainSelected() {
		return this.mainCheckBoxElement.is('.is-checked');
	}

	refreshMain() {
		let selectedCount = 0;
		for (let i = 0; i < this.count; i++) {
			if (this.isItemSelected(i)) {
				selectedCount++;
			}
		}

		if (selectedCount == 0) {
			this.setMain(false, false);
		} else if (selectedCount == this.count) {
			this.setMain(true, false);
		} else {
			this.setMainUndefined();
		}
	}

	refreshItemsBasedOnMain() {
		let val = this.isMainSelected();
		for (let i = 0; i < this.count; i++) {
			this.setSingleElement(i, val);
		}
	}

	onSingleItemChange(id) {

		this.refreshMain();

		this.onSingleChangeEvent(id, this.isItemSelected(id));

	}

	setSingleElement(id, val) {
		if (val) {
			this.checkBoxElements[id].get()[0].MaterialSwitch.on();
		} else {
			this.checkBoxElements[id].get()[0].MaterialSwitch.off();
		}
		this.refreshMain();


	}


	onMainChange() {
		this.clearMainUndefined();

		this.onMainChangeEvent(this.isMainSelected());
		this.refreshItemsBasedOnMain();

	}

	clearMainUndefined() {
		this.mainCheckBoxElement.children('.mdl-switch__thumb').css('left', '');
		this.mainCheckBoxElement.children('.mdl-switch__thumb').css('background-color', '');
		this.mainCheckBoxElement.children('.mdl-switch__track').css('background-color', '');
	}

	setMainUndefined() {
		this.mainCheckBoxElement.get()[0].MaterialSwitch.off();
		this.mainCheckBoxElement.children('.mdl-switch__thumb').css('left', '8px');
		this.mainCheckBoxElement.children('.mdl-switch__thumb').css('background-color', '#b1b1b1');
		this.mainCheckBoxElement.children('.mdl-switch__track').css('background-color', '#777777');
	}

	setMain(val, callRefresh = true) {
		this.clearMainUndefined();
		if (val) {
			this.mainCheckBoxElement.get()[0].MaterialSwitch.on();
		} else {
			this.mainCheckBoxElement.get()[0].MaterialSwitch.off();
		}

		if (callRefresh) {
			let thiz = this;
			setTimeout(thiz.refreshItemsBasedOnMain.bind(thiz), 0);
		}

	}
}



function showInfoModal(text,icon=undefined,iconColor=undefined,hideAfter=undefined) {
	remoteMeInfoModal= document.querySelector('#remoteMeInfoModal');

	if (remoteMeInfoModal==undefined){
		remoteMeInfoModal = $(` <dialog class="mdl-dialog" id="remoteMeInfoModal">
				<div class="mdl-dialog__content" style="padding:0px;margin:0px">
					<i class="icon"></i><h6 style="margin-top: 5px;">...</h6>
					<div style="clear: both"></div>
				</div>
			</dialog>`);

		$("body").append(remoteMeInfoModal);
		componentHandler.upgradeDom();
		remoteMeInfoModal= document.querySelector('#remoteMeInfoModal');
	}

	if (icon!=undefined){
		$(remoteMeInfoModal.querySelector(".icon")).attr('class','icon '+icon);
		$(remoteMeInfoModal.querySelector(".icon")).css("display",'inline');
		if (iconColor){
			$(remoteMeInfoModal.querySelector(".icon")).css("color",iconColor);
		}else{
			$(remoteMeInfoModal.querySelector(".icon")).css("color","#4c9ad6");
		}
		$(remoteMeInfoModal.querySelector("h6")).css("width","calc(100% - 52px)");
	}else{
		$(remoteMeInfoModal.querySelector(".icon")).css("display","none");
		$(remoteMeInfoModal.querySelector("h6")).css("width","100%");
	}

	if (! remoteMeInfoModal.showModal) {
		dialogPolyfill.registerDialog(remoteMeInfoModal);
	}


	if (remoteMeInfoModal.hideTimeOut!=undefined){
		clearTimeout(remoteMeInfoModal.hideTimeOut);
		remoteMeInfoModal.hideTimeOut=undefined;
	}
	if (hideAfter){
		remoteMeInfoModal.hideTimeOut=setTimeout(()=>closeInfoModal(), hideAfter*1000);
	}

	$(remoteMeInfoModal.querySelector("h6")).html(text);
	if (!remoteMeLoadingModal.hasAttribute("open")){
		remoteMeInfoModal.showModal();
	}


}
function closeInfoModal() {
	remoteMeInfoModal= document.querySelector('#remoteMeInfoModal');
	if (remoteMeInfoModal!=undefined){
		remoteMeInfoModal.close();
	}
}

function showProgressBarModal(text) {
	remoteMeLoadingModal= document.querySelector('#remoteMeLoadingModal');

	if (remoteMeLoadingModal==undefined){
		remoteMeLoadingModal = $(` <dialog class="mdl-dialog" id="remoteMeLoadingModal">
				<div class="mdl-dialog__content" style="padding:0px;margin:0px">
				<h6 style="margin-top: 5px;">...</h6>
				<div class="mdl-progress mdl-js-progress mdl-progress__indeterminate"></div>
				</div>
			</dialog>`);

		$("body").append(remoteMeLoadingModal);
		componentHandler.upgradeDom();
		remoteMeLoadingModal= document.querySelector('#remoteMeLoadingModal');
	}


	if (! remoteMeLoadingModal.showModal) {
		dialogPolyfill.registerDialog(remoteMeLoadingModal);
	}
	$(remoteMeLoadingModal.querySelector("h6")).html(text);
	if (!remoteMeLoadingModal.hasAttribute("open")){
		remoteMeLoadingModal.showModal();
	}


}
function closeProgressBarModal() {
	remoteMeLoadingModal= document.querySelector('#remoteMeLoadingModal');
	if (remoteMeLoadingModal!=undefined){
		remoteMeLoadingModal.close();
	}
}

function readProperties(selector) {
	var name = $(selector).attr("name");
	if ($(selector).attr("label") != undefined) {
		label = $(selector).attr("label");
	} else {
		label = name;
	}

	if ($(selector).attr("disabled") != undefined) {
		disabled = true;
	} else {
		disabled = false;
	}

	var min = 0;
	var max = 100;
	if ($(selector).attr("min") != undefined) {
		min = parseInt($(selector).attr("min"));
	}
	if ($(selector).attr("max") != undefined) {
		max = parseInt($(selector).attr("max"));
	}
	var disabled = false;
	disabled = $(selector).attr("disabled") != undefined;

	let minCreditForRental=getInteger("minCreditForRental", $(selector), 0);


	return {name: name, label: label, disabled: disabled, min: min, max: max, disabled: disabled,minCreditForRental:minCreditForRental};


}

function addPushButton(selector) {
	var prop = readProperties(selector);

	var element = $(`<button class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect" ${prop.disabled ? 'disabled' : ''}>${prop.label}	</button>`);

	remoteme.getVariables().observeBoolean(prop.name, x => {
		if (x) {
			$(element).addClass("mdl-button--accent");
		} else {
			$(element).removeClass("mdl-button--accent");
		}
	});

	if (!prop.disabled) {


		let startF=() => {
			if (!prop.disabled) {
				$(element).addClass("mdl-button--accent");
				RemoteMe.getInstance().getVariables().setBoolean(prop.name, true);
			}
		};

		let endF=() => {
			if (!prop.disabled) {
				$(element).removeClass("mdl-button--accent");
				RemoteMe.getInstance().getVariables().setBoolean(prop.name, false);
			}
		};

		$(element).mousedown(startF);
		$(element).bind('touchstart',startF);
		$(element).mouseup(endF);
		$(element).bind('touchend',endF);

		RemoteMe.getInstance().addComponentDisabled(prop.minCreditForRental, x => {
			$(element).prop("disabled", true);
		}, x => {
			$(element).prop("disabled", false);
		});
	}

	replaceComponent(selector, element);
	componentHandler.upgradeElement(element.get()[0]);


}

function addButton(selector) {
	var prop = readProperties(selector);

	var element = $(`<button class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect" ${prop.disabled ? 'disabled' : ''}>${prop.label}	</button>`);

	remoteme.getVariables().observeBoolean(prop.name, x => {
		if (x) {
			$(element).addClass("mdl-button--accent");
		} else {
			$(element).removeClass("mdl-button--accent");
		}
	});

	if (!prop.disabled) {
		$(element).click(() => {
			if (!prop.disabled) {
				var value = !$(element).hasClass("mdl-button--accent");
				RemoteMe.getInstance().getVariables().setBoolean(prop.name, value);
			}
		});
		RemoteMe.getInstance().addComponentDisabled(prop.minCreditForRental, x => {
			$(element).prop("disabled", true);
		}, x => {
			$(element).prop("disabled", false);
		});
	}

	replaceComponent(selector, element);
	componentHandler.upgradeElement(element.get()[0]);


}


function addColorChange(selector) {

	var max = 255;
	if ($(selector).attr("max") != undefined) {
		max = $(selector).attr("max");
	}
	var mn = max / 255;

	var prop = readProperties(selector);


	var dialog = $(`<dialog class="mdl-dialog">
		<div class="mdl-dialog__content">
		  <div class="wheelDemoWrapper"> </div>
		</div>
		<div class="mdl-dialog__actions">
		  <button type="button" class="mdl-button select">Select</button>
		  <button type="button" class="mdl-button close">Cancel</button>
		</div>
  </dialog>`);


	var newVar = dialog.find('.wheelDemoWrapper').get(0);
	var colorPicker = new iro.ColorPicker(newVar, {

		markerRadius: 8,
		borderWidth: 2,
		borderColor: "#fff",
		width: 230,
		height: 290,
		anticlockwise: true,
		color: '#000000'
	});

	$(dialog.find('.select').get(0)).click(() => {
		button.children(".color-badge").css("background-color", colorPicker.color.hexString);

		remoteme.getVariables().setSmallInteger3(prop.name, colorPicker.color.rgb.r * mn, colorPicker.color.rgb.g * mn, colorPicker.color.rgb.b * mn);

		dialog.get()[0].close();
	});

	$(dialog.find('.close').get(0)).click(() => {

		dialog.get()[0].close();
	});


	componentHandler.upgradeElement(dialog.get()[0]);

	if (!dialog.get()[0].showModal) {
		dialogPolyfill.registerDialog(dialog.get()[0]);
	}


	var button = $(`<button class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect color-badge-parent" ${prop.disabled ? 'disabled' : ''}><span  class="color-badge"></span> ${prop.label}	</button>`);

	if (!prop.disabled) {
		$(button).click(() => {
			if (!prop.disabled) {
				dialog.get()[0].showModal();
			}
		});
		RemoteMe.getInstance().addComponentDisabled(prop.minCreditForRental, x => {
			$(button).prop("disabled", true);
			prop.disabled = true;
		}, x => {
			$(button).prop("disabled", false);
			prop.disabled = false;
		});
	}


	remoteme.getVariables().observeSmallInteger3(prop.name, (r, g, b) => {
		r = Math.round(r / mn);
		g = Math.round(g / mn);
		b = Math.round(b / mn);
		if (colorPicker.color != undefined) {
			colorPicker.color.rgb = {r: r, g: g, b: b};
		}

		button.children(".color-badge").css("background-color", `rgb(${r}, ${g}, ${b})`);
	});


	replaceComponent(selector, button);


	$("body").append(dialog);
	componentHandler.upgradeElement(button.get()[0]);


}

function addCheckBox(selector, switchMode = false) {
	var prop = readProperties(selector);

	var temp = id++;
	var checkBoxElement;
	if (switchMode) {
		checkBoxElement = $(`<label class="mdl-switch mdl-js-switch mdl-js-ripple-effect" for="switch-${temp}">
			<input type="checkbox" id="switch-${temp}" class="mdl-switch__input" ${prop.disabled ? 'disabled' : ''}>
			<span class="mdl-switch__label">${prop.label}</span>
			</label>`);
	} else {
		checkBoxElement = $(`
		<label class="mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect" for="checkbox-${temp}">
		  <input type="checkbox" id="checkbox-${temp}" class="mdl-checkbox__input" ${prop.disabled ? 'disabled' : ''}>
		  <span class="mdl-checkbox__label">${prop.label}</span>
		</label>
	`);
	}

	var checkbox = checkBoxElement.find("input");

	if (!prop.disabled) {
		RemoteMe.getInstance().addComponentDisabled(prop.minCreditForRental, x => {
			$(checkBoxElement).prop("disabled", true);
			$(checkBoxElement).find("input").prop("disabled", true);
			if (switchMode) {
					checkBoxElement.get()[0].MaterialSwitch.disable();
			} else {
				checkBoxElement.get()[0].MaterialCheckbox.disable();
			}

			prop.disabled = true;
		}, x => {
			$(checkBoxElement).prop("disabled", false);
			$(checkBoxElement).find("input").prop("disabled", false);
			if (switchMode) {
				checkBoxElement.get()[0].MaterialSwitch.enable();
			} else {
				checkBoxElement.get()[0].MaterialCheckbox.enable();
			}
			prop.disabled = false;
		});
		checkbox.change(function () {
			if (!prop.disabled) {
				remoteme.getVariables().setBoolean(prop.name, !checkBoxElement.is('.is-checked'));
			}
		});
	}


	remoteme.getVariables().observeBoolean(prop.name, x => {
		if (switchMode) {
			if (x) {
				checkBoxElement.get()[0].MaterialSwitch.on();
			} else {
				checkBoxElement.get()[0].MaterialSwitch.off();
			}
		} else {
			if (x) {
				checkBoxElement.get()[0].MaterialCheckbox.check();
			} else {
				checkBoxElement.get()[0].MaterialCheckbox.uncheck();
			}

		}

	});


	replaceComponent(selector, checkBoxElement);

	componentHandler.upgradeElement(checkBoxElement[0]);
}


function addSlider(selector, switchMode = false) {
	addXSliders(selector, 1);
}

function add2Sliders(selector) {
	addXSliders(selector, 2);
}

function add3Sliders(selector) {
	addXSliders(selector, 3);

}


function addXSliders(selector, count) {
	var prop = readProperties(selector);

	var valueBox = getBoolean("valueBox", $(selector), true);
	var onlyDirect = getBoolean("onlyDirect", $(selector), false);

	var box = $(`<div class="box"><p>${prop.label}</p></div>`);
	var sliders = [];
	var labels = [];
	var elements = [];

	for (let i = 0; i < count; i++) {
		sliders[i] = $(`<input class="mdl-slider mdl-js-slider" type="range" min="${prop.min}" max="${prop.max}" value="0" tabindex="0" ${prop.disabled ? 'disabled' : ''}>`);


		if (valueBox) {
			labels[i] = $(`<div style="float:left;margin-top:-10px;min-width:20px">0</div>`);
			var div = $(`<div></div>`);
			div.append(labels[i]);
			div.append(sliders[i]);
			div.append($(`<div style="clear:both"></div>`));
			elements[i] = div;
		} else {
			elements[i] = sliders;
		}


	}


	var onChange;

	if (!prop.disabled) {
		RemoteMe.getInstance().addComponentDisabled(prop.minCreditForRental, x => {
			for (let i = 0; i < count; i++) {
				sliders[i].prop("disabled", true);
			}


		}, x => {
			for (let i = 0; i < count; i++) {
				sliders[i].prop("disabled", false);
			}
		});


		if (count == 1) {
			onChange = (() => {
				otChange200.execute(() => {
					remoteme.getVariables().setInteger(prop.name, sliders[0].val(), onlyDirect);
				});

			});
		} else if (count == 2) {
			onChange = (() => {
				otChange200.execute(() => {
					remoteme.getVariables().setSmallInteger2(prop.name, sliders[0].val(), sliders[1].val(), onlyDirect);
				});

			});
		} else if (count == 3) {
			onChange = (() => {
				otChange200.execute(() => {
					remoteme.getVariables().setSmallInteger3(prop.name, sliders[0].val(), sliders[1].val(), sliders[2].val(), onlyDirect);
				});

			});
		}

		for (let i = 0; i < count; i++) {
			box.append(elements[i]);
			sliders[i].on('input', onChange);
		}
	}


	if (count == 1) {
		remoteme.getVariables().observeInteger(prop.name, x => {
			sliders[0].val(x);
			if (valueBox) {
				labels[0].html(x);
			}
		});
	} else if (count == 2) {
		remoteme.getVariables().observeSmallInteger2(prop.name, (x1, x2) => {
			sliders[0].val(x1);
			sliders[1].val(x2);
			if (valueBox) {
				labels[0].html(x1);
				labels[1].html(x2);
			}
		});
	} else if (count == 3) {
		remoteme.getVariables().observeSmallInteger3(prop.name, (x1, x2, x3) => {
			sliders[0].val(x1);
			sliders[1].val(x2);
			sliders[2].val(x3);
			if (valueBox) {
				labels[0].html(x1);
				labels[1].html(x2);
				labels[2].html(x3);
			}
		});
	}

	replaceComponent(selector, box);


	for (var i = 0; i < count; i++) {
		componentHandler.upgradeElement(sliders[i].get()[0]);

	}

}


function addGauge(selector) {


	var prop = readProperties(selector);


	var widthheight = $(selector).attr("widthheight");

	var borders = getBoolean("borders", $(selector), true);
	var valueBox = getBoolean("valueBox", $(selector), true);


	var majorTick = parseInt($(selector).attr("tickDelta"));
	var minorTick = parseInt($(selector).attr("minorTick"));

	var ticks = [];

	if (majorTick > 0) {
		for (var val = prop.min; val <= prop.max; val += majorTick) {
			ticks.push(val);
		}
	}


	widthheight = widthheight + "px";

	var canvas = $(`<canvas ></canvas>`);

	replaceComponent(selector, canvas);

	var gauge = new RadialGauge({
		renderTo: canvas.get()[0],
		width: widthheight,
		height: widthheight,
		units: label,
		minValue: prop.min,
		maxValue: prop.max,
		majorTicks: ticks,
		minorTicks: minorTick,
		strokeTicks: true,
		highlights: [],
		colorPlate: "#fff",
		borderShadowWidth: 0,
		borders: borders,
		needleType: "arrow",
		needleWidth: 2,
		valueBox: valueBox,
		needleCircleSize: 7,
		needleCircleOuter: true,
		needleCircleInner: false,
		animationDuration: -1,
		animationRule: "linear"
	}).draw();


	remoteme.getVariables().observeInteger(prop.name, x => {
		gauge.value = x;

	});
	$(canvas).css(`width:${widthheight};height:${widthheight},font-size:10px`)

}

function addList(selector, variableType) {

	var prop = readProperties(selector);


	var temp = id++;
	var element = $(`<div class="mdl-textfield mdl-js-textfield getmdl-select ${prop.disabled ? 'disabled' : ''}">
			<input type="text" value="" class="mdl-textfield__input" id="select${temp}" readonly>
			<input type="hidden" value="" name="select${temp}" class="value">
			<i class="mdl-icon-toggle__label material-icons">keyboard_arrow_down</i>
			<label for="select${temp}" class="mdl-textfield__label">${prop.label}</label>
			<ul for="select${temp}" class="mdl-menu mdl-menu--bottom-left mdl-js-menu" >
				
			</ul>
		</div>`);

	var ul = element.find('ul').get(0);
	if (prop.disabled) {
		$(ul).css("display", "none");
	} else {
		element.get()[0].onChange = (val) => {
			if (!prop.disabled) {
				remoteme.getVariables().set(prop.name, variableType, [val]);
			}
		};
		RemoteMe.getInstance().addComponentDisabled(prop.minCreditForRental, x => {
			$(element).prop("disabled", true);
			$(element).find("input").prop("disabled", true);
			$(element).find("i").css("display", "none");
			$(ul).css("display", "none");
			prop.disabled = true;
		}, x => {
			$(element).prop("disabled", false);
			$(element).find("input").prop("disabled", false);
			$(ul).css("display", "block");
			$(element).find("i").css("display", "block");
			prop.disabled = false;
		});
	}

	var toInsert = $(selector).find("option");
	for (var i = 0; i < toInsert.length; i++) {
		var label = $(toInsert[i]).html();
		var val = $(toInsert[i]).attr('value');
		console.log(label + " " + val);
		toInsert.remove();
		$(ul).append($(`<li class="mdl-menu__item" data-val="${val}">${label}</li>`));
	}
	element.get()[0].disabled = prop.disabled;


	remoteme.getVariables().observe(prop.name, variableType, x => {
		element.get()[0].set(x);
	});


	replaceComponent(selector, element);

	getmdlSelect.init(element[0]);

}


function addRadios(selector, variableType) {


	var prop = readProperties(selector);


	var box = $(`<div class="box"><p>${prop.label}</p></div>`);
	var radios = [];


	var temp = id++;
	var toInsert = $(selector).find("option");
	var elements = [];
	for (var i = 0; i < toInsert.length; i++) {
		var label = $(toInsert[i]).html();
		var val = $(toInsert[i]).attr('value');

		toInsert.remove();

		var toInsertElement = $(`<label class="mdl-radio mdl-js-radio mdl-js-ripple-effect" for="${temp}-option-${val}" >
					  <input type="radio" id="${temp}-option-${val}" class="mdl-radio__button" name="options${temp}" value="${val}" ${prop.disabled ? 'disabled' : ''}>
					  <span class="mdl-radio__label">${label}</span>
					</label>`);

		var checkboxZ = toInsertElement.find("input");

		checkboxZ.change(function (s) {
			if (!prop.disabled) {
				remoteme.getVariables().set(prop.name, variableType, [$(s.currentTarget).attr("value")]);
			}
		});
		box.append(toInsertElement);
		elements[val] = (toInsertElement);


	}

	if (!prop.disabled) {
		RemoteMe.getInstance().addComponentDisabled(prop.minCreditForRental, x => {
			$(box).find("input").prop("disabled", true);
			for (let el in elements) {
				elements[el][0].MaterialRadio.disable();
			}
			prop.disabled = true;
		}, x => {
			$(box).find("input").prop("disabled", false);
			for (let el in elements) {
				elements[el][0].MaterialRadio.enable();
			}
		});
	}


	remoteme.getVariables().observe(prop.name, variableType, x => {
		if (elements[x] != undefined) {
			$(elements[x])[0].MaterialRadio.check();
		}
	});


	replaceComponent(selector, box);

}

function replaceComponent(selector, element) {
	if ($(selector).attr("style") != undefined) {
		$(element).attr("style", $(selector).attr("style"));
	}
	if ($(selector).attr("class") != undefined) {
		$(element).addClass($(selector).attr("class"));
	}

	$(selector).replaceWith(element);


}

function addTextField(selector, variableType) {


	var prop = readProperties(selector);

	var label;


	var temp = id++;

	var pattern = undefined;

	if (variableType == VariableOberverType.INTEGER) {
		pattern = "-?[0-9]*"
	} else if (variableType == VariableOberverType.DOUBLE) {
		pattern = "-?[0-9]*(\.[0-9]+)?"
	} else {
		pattern = "*."
	}

	var textField = $(`<div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label textWithApply ${prop.disabled ? 'disabled' : ''}">
			<input class="mdl-textfield__input" type="text" id="textField-${temp}" pattern="${pattern}" ${prop.disabled ? 'disabled' : ''}>
			<label class="material-icons" for="textField-${temp}">publish</label>
			<label class="mdl-textfield__label" for="textField-${temp}">${prop.label}</label>
		</div>`);


	var input = $(textField).find("input");
	var button = $(textField).find(".material-icons");


	if (!prop.disabled) {
		button.click(() => {
			if (!prop.disabled) {
				remoteme.getVariables().set(prop.name, variableType, [input[0].value]);
			}

		});

		input.keypress(function (e) {
			if (!prop.disabled) {
				if (e.which == 13) {
					remoteme.getVariables().set(prop.name, variableType, [input[0].value]);
					return false;
				}
			}
		});

		RemoteMe.getInstance().addComponentDisabled(prop.minCreditForRental, x => {
			prop.disabled = true;
			$(button).css("display", "none");

			$(input).prop("disabled", true);
		}, x => {
			prop.disabled = false;
			$(button).css("display", "block");
			$(input).prop("disabled", false);
		});

	}


	remoteme.getVariables().observe(prop.name, variableType, x => {
		input.val(x).parent().addClass('is-focused');
	});


	replaceComponent(selector, textField);

}


function addDiv(selector, variableType) {


	var prop = readProperties(selector);

	var template = "{value}";


	if ($(selector).attr("template") != undefined) {
		template = $(selector).attr("template");
	}


	var text = template.replace("{value}", "...");
	text = text.replace("{name}", prop.name);


	var div = $(`<div>${text}</div>`);

	remoteme.getVariables().observe(prop.name, variableType, x => {
		var text = template.replace("{value}", x);
		text = text.replace("{name}", prop.name);

		div.html(text);
	});

	replaceComponent(selector, div);

}

function addJoystick(selector) {

	var prop = readProperties(selector);


	var invertX = getBoolean("invertX", $(selector), false);
	var invertY = getBoolean("invertY", $(selector), false);

	var xMin = getInteger("xMin", $(selector), -100);
	var xMax = getInteger("xMax", $(selector), 100);
	var yMin = getInteger("yMin", $(selector), -100);
	var yMax = getInteger("yMax", $(selector), 100);
	var onlyDirect = getBoolean("onlyDirect", $(selector), false);


	if ($(selector).attr("xRange") != undefined) {
		xMin = -parseInt($(selector).attr("xRange"));
		xMax = parseInt($(selector).attr("xRange"));
	}


	if ($(selector).attr("yRange") != undefined) {
		yMin = -parseInt($(selector).attr("yRange"));
		yMax = parseInt($(selector).attr("yRange"));
	}


	if (invertX) {
		let temp = xMin;
		xMin = xMax;
		xMax = temp;
	}
	if (invertY) {
		let temp = yMin;
		yMin = yMax;
		yMax = temp;
	}


	var touch = new Touch(selector, xMin, xMax, yMin, yMax, (x, y) => {

		otChange200.executeWithId(prop.name + "SmallInteger2", () => {
			if (!prop.disabled) {
				remoteme.getVariables().setSmallInteger2(prop.name, x, y, onlyDirect);
			}

		});

	});

	RemoteMe.getInstance().addComponentDisabled(prop.minCreditForRental, x => {
		prop.disabled = true;
		touch.disable(true);
	}, x => {
		prop.disabled = false;
		touch.disable(false);
	});

}


var schedulerUID = 0;

function addVariableSchedulerMultiState(selector) {

	var prop = readProperties(selector);

	var label = getString("label", $(selector), "Schedulers");

	var toInsert = $(selector).find("variablescheduler");

	let variableSchedulerNames = [];
	let variableSchedulerIds = [];
	for (let i = 0; i < toInsert.length; i++) {
		variableSchedulerNames.push($(toInsert[i]).html());
		variableSchedulerIds.push(parseInt($(toInsert[i]).attr('value')));
	}


	if (variableSchedulerIds.length != 1) {
		let multiTouch = new MultiSwitch(selector, label, variableSchedulerNames, (val) => {
			console.info("main change" + val);

			let temp = [];
			for (let id of variableSchedulerIds) {
				temp.push({variableSchedulerId: id, state: val});
			}
			remoteme.send(getSetVariableSchedulerStateMessage(temp));

		}, (id, val) => {
			console.info("single change " + id + " " + val);
			remoteme.send(getSetVariableSchedulerStateMessage([{
				variableSchedulerId: variableSchedulerIds[id],
				state: val
			}]));
		});
		multiTouch.setMain(false);

		remoteme.remoteMeConfig.variableSchedulerStateChange.push((variableSchedulerId, state) => {
			let elementPos = variableSchedulerIds.indexOf(variableSchedulerId);
			if (elementPos != -1) {
				multiTouch.setSingleElement(elementPos, state);
			}
		});

	} else {
		let temp = "schedulerUID" + (schedulerUID++);

		checkBoxElement = $(`<label class="mdl-switch mdl-js-switch mdl-js-ripple-effect" for="switch-${temp}">
			<input type="checkbox" id="switch-${temp}" class="mdl-switch__input" >
			<span class="mdl-switch__label">${label}</span>
			</label>`);


		let checkbox = checkBoxElement.find("input");


		checkbox.change(function () {
			let stats = !checkBoxElement.is('.is-checked');
			remoteme.send(getSetVariableSchedulerStateMessage([{
				variableSchedulerId: variableSchedulerIds[0],
				state: stats
			}]));
		});

		remoteme.remoteMeConfig.variableSchedulerStateChange.push((variableSchedulerId, state) => {
			if (variableSchedulerId == variableSchedulerIds[0]) {
				if (state) {
					checkBoxElement.get()[0].MaterialSwitch.on();
				} else {
					checkBoxElement.get()[0].MaterialSwitch.off();
				}
			}
		});


		replaceComponent(selector, checkBoxElement);

		componentHandler.upgradeElement(checkBoxElement[0]);
	}


	remoteme.subscribeEvent(EventSubscriberTypeEnum.VARIABLE_SCHEDULER_STATE);


}

function addCameraMouseTracking(selector) {

	let prop = readProperties(selector);

	let invertX = getBoolean("invertX", $(selector), false);
	let invertY = getBoolean("invertY", $(selector), false);

	let xMin = getInteger("xMin", $(selector), -100);
	let xMax = getInteger("xMax", $(selector), 100);
	let yMin = getInteger("yMin", $(selector), -100);
	let yMax = getInteger("yMax", $(selector), 100);

	let requiredMouseDown = getBoolean("requiredMouseDown", $(selector), true);
	let reset = getBoolean("reset", $(selector), true);
	let onlyDirect = getBoolean("onlyDirect", $(selector), false);


	if (invertX) {
		let temp = xMin;
		xMin = xMax;
		xMax = temp;
	}
	if (invertY) {
		let temp = yMin;
		yMin = yMax;
		yMax = temp;
	}


	let video = $("video");
	if (video.get(0) != undefined) {

		RemoteMe.getInstance().addComponentDisabled(prop.minCreditForRental, x => {
			prop.disabled = true;
		}, x => {
			prop.disabled = false;
		});

		let sendNow = (x, y, onlyDirect) => {

			if (!prop.disabled) {
				x = Math.min(1, Math.max(-1, x));
				y = Math.min(1, Math.max(-1, y));

				otChange200.executeWithId(prop.name + "SmallInteger2", () => {
					let xS = Math.round(getProportional(xMin, xMax, x));
					let yS = Math.round(getProportional(yMin, yMax, y));
					remoteme.getVariables().setSmallInteger2(prop.name, xS, yS, onlyDirect);
					console.info(xS + " " + yS);
				});
			}

		};

		video.on("mousemove mousedown", event => {
			if (event.which === 1 || !requiredMouseDown) {
				let ox = event.offsetX;
				let oy = event.offsetY;
				let width = video.width();
				let height = video.height();

				let x = (ox / width - 0.5) * 2;
				let y = -(oy / height - 0.5) * 2;

				sendNow(x, y, onlyDirect);
			}

		});

		video.on("touchmove touchstart", e => {
			e.preventDefault();


			let ox = e.touches[0].pageX - e.touches[0].target.offsetLeft;
			let oy = e.touches[0].pageY - e.touches[0].target.offsetTop;
			let width = video.width();
			let height = video.height();

			let x = (ox / width - 0.5) * 2;
			let y = -(oy / height - 0.5) * 2;

			sendNow(x, y, onlyDirect);
		});

		if (reset) {
			video.on("touchend mouseup", e => {
				sendNow(0, 0, onlyDirect);
			});
		}
	}
}

function getOnDeviceConnectionChange(cnt, icon, deviceToWatch) {
	return (deviceId, connected) => {
		if (deviceToWatch == deviceId) {
			cnt.removeClass();
			if (connected) {
				icon.html("link");
				cnt.addClass("connected");
				icon.animateCss("rubberBandMore");
			} else {
				icon.html("link_off");
				cnt.addClass("disconnected");
				icon.animateCss("zoomOut");
			}


		}

	}
}


function addDeviceConnectionStatus(selector) {
	let deviceId = getInteger("deviceId", $(selector), false);
	let text = getString("text", $(selector), "");

	let box = $(`<div class='deviceStatusIcons'></div>`);

	let icon = $(`<i class='material-icons'>link_off</i>`);
	let cnt = $(`<div class='disconnected'></div>`);
	icon.click(remoteme.onOffWebSocket.bind(remoteme));
	cnt.append(icon);
	cnt.append($(`<div class='text'>${text}</div>`));
	box.append(cnt);
	if (thisDeviceId == deviceId) {
		let toCall = getOnDeviceConnectionChange(cnt, icon, thisDeviceId);
		remoteme.remoteMeConfig.webSocketConnectionChange.push((status) => {
			toCall(thisDeviceId, status == ConnectingStatusEnum.CONNECTED)
		});

	} else {
		remoteme.remoteMeConfig.deviceConnectionChange.push(getOnDeviceConnectionChange(cnt, icon, deviceId));

	}

	remoteme.subscribeEvent(EventSubscriberTypeEnum.DEVICE_CONNECTION);


	replaceComponent(selector, box);

}


function getOnConnectionChange(cnt, icon) {
	return (status) => {
		cnt.removeClass();

		if (status == ConnectingStatusEnum.CONNECTING) {
			icon.addClass("connecting");
			icon.animateCss("pulseMore", true);
		} else if (status == ConnectingStatusEnum.CONNECTED) {
			cnt.addClass("connected");
			icon.animateCss("rubberBandMore");
		} else if (status == ConnectingStatusEnum.DISCONNECTED) {
			cnt.addClass("disconnected");
			icon.animateCss("zoomOut");
		} else if (status == ConnectingStatusEnum.FAILED) {
			cnt.addClass("failed");
			icon.animateCss("shake");
		} else if (status == ConnectingStatusEnum.DISCONNECTING) {
			cnt.addClass("disconnecting");
			icon.animateCss("pulseMore", true);
		} else if (status == ConnectingStatusEnum.CHECKING) {
			cnt.addClass("checking");
			icon.animateCss("pulseMore", true);
		}
	}
}

function addconnectionStatus(selector) {


	let webSocket = getBoolean("webSocket", $(selector), false);
	let directConnection = getBoolean("directConnection", $(selector), false);
	let camera = getBoolean("camera", $(selector), false);


	let box = $(`<div class='statusIcons'></div>`);

	if (webSocket) {

		let icon = $(`<i class='material-icons'>cloud_done</i>`);
		let cnt = $(`<div class='disconnected'></div>`);
		icon.click(remoteme.onOffWebSocket.bind(remoteme));
		cnt.append(icon);
		box.append(cnt);
		remoteme.remoteMeConfig.webSocketConnectionChange.push(getOnConnectionChange(cnt, icon));
	}

	if (directConnection) {
		let icon = $(`<i class='material-icons'>link</i>`);
		let cnt = $(`<div class='disconnected'></div>`);
		icon.click(remoteme.onOffDirectConnection.bind(remoteme));

		cnt.append(icon);
		box.append(cnt);
		remoteme.remoteMeConfig.directConnectionChange.push(getOnConnectionChange(cnt, icon));
	}

	if (camera) {

		let icon = $(`<i class='material-icons'>videocam</i>`);
		let cnt = $(`<div class='disconnected'></div>`);
		icon.click(remoteme.onOffWebRTC.bind(remoteme));

		cnt.append(icon);
		box.append(cnt);
		remoteme.remoteMeConfig.webRtcConnectionChange.push(getOnConnectionChange(cnt, icon));
	}


	replaceComponent(selector, box);

}


function addCamera(selector) {


	let autoConnect = false;
	let showInfo = true;


	let style = "";
	let clazz = "";
	if ($(selector).attr("autoConnect") != undefined) {
		autoConnect = $(selector).attr("autoConnect") == "true";
	}

	if ($(selector).attr("showInfo") != undefined) {
		showInfo = $(selector).attr("showInfo") == "true";
	}


	if ($(selector).attr("style") == undefined && $(selector).attr("class") == undefined) {
		let width = "400px";
		let height = "300px";


		if ($(selector).attr("width") != undefined) {
			width = $(selector).attr("width");
		}

		if ($(selector).attr("height") != undefined) {
			height = $(selector).attr("height");
		}

		style = `style=width:${width};height:${height}`;
	}

	if ($(selector).attr("style") != undefined) {
		style = "style=\"" + $(selector).attr("style");
		+"\"";
	}

	if ($(selector).attr("class") != undefined) {
		clazz = "class=\"" + $(selector).attr("class") + "\"";
	} else {
		clazz = "class=\"camera\"";
	}

	let box = $(`<video id="remoteVideo"  muted="muted" autoplay="autoplay" ondblclick="fullscreen(this)" ${style} ${clazz} ></video>`);

	if (showInfo) {


		remoteme.remoteMeConfig.webRtcConnectionChange.push((state) => {


			if (state == ConnectingStatusEnum.CONNECTED) {
				showProgressBarModal("View Connected");
				setTimeout(function () {
					closeProgressBarModal();
				}, 1000);
			} else if (state == ConnectingStatusEnum.CONNECTING) {
				showProgressBarModal("View Connecting");
			} else if (state == ConnectingStatusEnum.DISCONNECTING) {
				showProgressBarModal("View Disconnecting");
			} else if (state == ConnectingStatusEnum.CHECKING) {
				showProgressBarModal("View Checking");
			} else if (state == ConnectingStatusEnum.DISCONNECTED) {
				showProgressBarModal("View Disconnected");
				setTimeout(function () {
					closeProgressBarModal();
				}, 1500);
			} else if (state == ConnectingStatusEnum.FAILED) {
				showProgressBarModal("View Failed");
				setTimeout(function () {
					closeProgressBarModal();
				}, 1500);
			}

		});
	}


	replaceComponent(selector, box);

	if (autoConnect) {
		remoteme.setautomaticallyConnectWebRTC();
	}


}

function getString(elementName, element, defValue) {
	if (element.attr(elementName) != undefined) {
		defValue = $(element).attr(elementName);
	}
	return defValue;
}

function getInteger(elementName, element, defValue) {
	if (element.attr(elementName) != undefined) {
		defValue = parseInt($(element).attr(elementName));
	}
	return defValue;
}

function getBoolean(elementName, element, defValue) {

	if (element.attr(elementName) != undefined) {
		defValue = $(element).attr(elementName) == "true";
	}
	return defValue;
}

function addGyroscope(selector) {
	let prop = readProperties(selector);

	let invertX = getBoolean("invertX", $(selector), false);
	let invertY = getBoolean("invertY", $(selector), false);

	let xMin = getInteger("xMin", $(selector), -100);
	let xMax = getInteger("xMax", $(selector), 100);
	let yMin = getInteger("yMin", $(selector), -100);
	let yMax = getInteger("yMax", $(selector), 100);
	let xRange = getInteger("xRange", $(selector), 20);
	let yRange = getInteger("yRange", $(selector), 20);

	let onlyDirect = getBoolean("onlyDirect", $(selector), false);

	let xySwap = getBoolean("xySwap", $(selector), false);
	let orientationSupport = getBoolean("orientationSupport", $(selector), false);


	if (invertX) {
		let temp = xMin;
		xMin = xMax;
		xMax = temp;
	}
	if (invertY) {
		let temp = yMin;
		yMin = yMax;
		yMax = temp;
	}


	let element = $(`<button class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect" >${prop.label}</button>`);

	let gyroscope = new Gyroscope(xMin, xMax, yMin, yMax, xRange, yRange, xySwap, orientationSupport, (x, y, xN, yN) => {
		if (!prop.disabled){
			otChange200.execute(() => {
				element.html(prop.label + " " + nicePrint(xN) + " " + nicePrint(yN));

				remoteme.getVariables().setSmallInteger2(prop.name, x, y, onlyDirect);
			});
		}

	});


	$(element).click(() => {
		if (gyroscope.onOff()) {
			$(element).addClass("mdl-button--accent");
		} else {
			$(element).removeClass("mdl-button--accent");
			element.html(prop.label);
		}

	});

	if (!prop.disabled){
		RemoteMe.getInstance().addComponentDisabled(prop.minCreditForRental, x => {
			$(element).prop("disabled",true);
			prop.disabled=true;
		}, x => {
			$(element).prop("disabled", false);
			prop.disabled=false;
		});

	}


	replaceComponent(selector, element);
	componentHandler.upgradeElement(element.get()[0]);
}

function addGallery(selector) {




	let prop = readProperties(selector);


	let mask = getString("mask", $(selector), "");
	let deviceId = getInteger("deviceId", $(selector), thisDeviceId);
	let imageWidth = getString("imageWidth", $(selector), "100%");
	let imageHeight = getString("imageHeight", $(selector), "250px");

	let dateFormat = getString("dateFormat", $(selector), "DD.MM.YYYY HH:mm");
	let displayDate = getBoolean("displayDate", $(selector),false);


	let container = $(`<div class="infinitiveScrollContainer"> </div>`);


	let count=5;

	container[0].current=-1;

	container[0].append=()=>{

		let url = `/api/rest/v1/file/get/deviceId/${deviceId}/pos/${(container[0].current+1)}/count/${count}/?mask=${encodeURIComponent(mask)}`;

		let loading = $(`<div class='galleryLoader  animated infinite pulse' id="#loadingGallery"><i class='material-icons'>autorenew</i><i class="loadingText">Loading</i><i style="clear: both"></i></div>`);
		container.append(loading);
		window.scrollTo(0,document.body.scrollHeight);


		RemoteMeRest_callRest(url,"GET",data=>{
			console.info(data);
			loading.remove();

			for(file of data){
				console.info(file);
				let newElement = $(`<div class='preview' style="background-image:url('/wp/device_${deviceId}/${file.name}');width:${imageWidth};height:${imageHeight}"></div>`);
				container.append(newElement);

				if (displayDate){
					let date = $(`<div class='created'>${moment(file.createdAt).format(dateFormat) }</div>`);
					container.append(date);
				}

				container[0].current++;
			}

			if (data.length==count){
				container[0].block=false;
				container[0].check();
			}

		},error=>{

		});


	};

	container[0].check=()=>{
		if($(window).scrollTop() + $(window).height() >= $(document).height()-100) {
			if (!container[0].block){
				container[0].block=true;
				container[0].append();

			}
		}
	};
	$(window).scroll(function(x){
		container[0].check();
	});
	replaceComponent(selector, container);


	container[0].check();
}

function replace() {
	let connectionStatus = $("connectionstatus");
	for (let i = 0; i < connectionStatus.length; i++) {
		addconnectionStatus(connectionStatus[i]);
	}
	let gallery = $("gallery");
	for (let i = 0; i < gallery.length; i++) {
		addGallery(gallery[i]);
	}

	let deviceConnectionStatus = $("deviceconnectionstatus");
	for (let i = 0; i < deviceConnectionStatus.length; i++) {
		addDeviceConnectionStatus(deviceConnectionStatus[i]);
	}


	let multiVariableScheduler = $("variableschedulersstate");
	for (let i = 0; i < multiVariableScheduler.length; i++) {
		addVariableSchedulerMultiState(multiVariableScheduler[i]);
	}

	let camera = $("camera");
	for (let i = 0; i < camera.length; i++) {
		addCamera(camera[i]);
	}
	let variables = $("variable");
	for (let i = 0; i < variables.length; i++) {
		variable = variables[i];
		if ($(variable).attr("type") == "BOOLEAN" && $(variable).attr("component") == "button") {
			addButton(variable);
		}if ($(variable).attr("type") == "BOOLEAN" && $(variable).attr("component") == "pushbutton") {
			addPushButton(variable);
		} else if ($(variable).attr("type") == "BOOLEAN" && $(variable).attr("component") == "checkbox") {
			addCheckBox(variable);
		} else if ($(variable).attr("type") == "BOOLEAN" && $(variable).attr("component") == "switcher") {
			addCheckBox(variable, true);
		}
		else if ($(variable).attr("type") == "INTEGER" && $(variable).attr("component") == "slider") {
			addSlider(variable);
		} else if ($(variable).attr("type") == "SMALL_INTEGER_3" && $(variable).attr("component") == "slider") {
			add3Sliders(variable);
		} else if ($(variable).attr("type") == "SMALL_INTEGER_2" && $(variable).attr("component") == "slider") {
			add2Sliders(variable);
		}
		else if ($(variable).attr("type") == "INTEGER" && $(variable).attr("component") == "gauge") {
			addGauge(variable);
		}

		else if ($(variable).attr("type") == "INTEGER" && $(variable).attr("component") == "dropDownList") {
			addList(variable, VariableOberverType.INTEGER);
		} else if ($(variable).attr("type") == "TEXT" && $(variable).attr("component") == "dropDownList") {
			addList(variable, VariableOberverType.TEXT);
		} else if ($(variable).attr("type") == "DOUBLE" && $(variable).attr("component") == "dropDownList") {
			addList(variable, VariableOberverType.DOUBLE);
		}

		else if ($(variable).attr("type") == "INTEGER" && $(variable).attr("component") == "radio") {
			addRadios(variable, VariableOberverType.INTEGER);
		} else if ($(variable).attr("type") == "TEXT" && $(variable).attr("component") == "radio") {
			addRadios(variable, VariableOberverType.TEXT);
		} else if ($(variable).attr("type") == "DOUBLE" && $(variable).attr("component") == "radio") {
			addRadios(variable, VariableOberverType.DOUBLE);
		}


		else if ($(variable).attr("type") == "INTEGER" && $(variable).attr("component") == "textField") {
			addTextField(variable, VariableOberverType.INTEGER);
		} else if ($(variable).attr("type") == "TEXT" && $(variable).attr("component") == "textField") {
			addTextField(variable, VariableOberverType.TEXT);
		} else if ($(variable).attr("type") == "DOUBLE" && $(variable).attr("component") == "textField") {
			addTextField(variable, VariableOberverType.DOUBLE);
		}


		else if ($(variable).attr("type") == "INTEGER" && $(variable).attr("component") == "div") {
			addDiv(variable, VariableOberverType.INTEGER);
		} else if ($(variable).attr("type") == "TEXT" && $(variable).attr("component") == "div") {
			addDiv(variable, VariableOberverType.TEXT);
		} else if ($(variable).attr("type") == "DOUBLE" && $(variable).attr("component") == "div") {
			addDiv(variable, VariableOberverType.DOUBLE);
		}

		else if ($(variable).attr("type") == "SMALL_INTEGER_3" && $(variable).attr("component") == "color") {
			addColorChange(variable);
		}

		else if ($(variable).attr("type") == "SMALL_INTEGER_2" && ($(variable).attr("component") == "joystick" || ($(variable).attr("component") == "joystick_simple"))) {
			addJoystick(variable);
		} else if ($(variable).attr("type") == "SMALL_INTEGER_2" && $(variable).attr("component") == "gyroscope") {
			addGyroscope(variable);
		}


	}
	variables = $("variable");
	for (let i = 0; i < variables.length; i++) {
		variable = variables[i];
		if ($(variable).attr("component") == "cameraMouseTrack") {
			addCameraMouseTracking(variable);
		}
	}
}

$(document).ready(function () {

	remoteme = RemoteMe.getInstance();
	remoteme.connectDirectConnection();

	replace();
	if (typeof doNotCreateRemoteMe !== 'undefined' && doNotCreateRemoteMe == true) {
		remoteme.sendDirectWebsocket = () => {
		};
		remoteme.sendRest = () => {
		};
		remoteme.sendWebSocketText = () => {
		};
		remoteme.sendWebRtc = () => {
		};
		remoteme.sendWebSocket = () => {
		};
		remoteme.directWebSocketConnectionConnect = () => {
		};
		remoteme.connectWebSocket = () => {
		};

	}

});


function addDatePickerForChart(id, date1, date2, onSet) {
	$(`#${id}`).daterangepicker({
		startDate: date1,
		endDate: date2,

		ranges: {
			'Today': [moment(), moment()],
			'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
			'Last 7 Days': [moment().subtract(6, 'days'), moment()],
			'Last 30 Days': [moment().subtract(29, 'days'), moment()],
			'This Month': [moment().startOf('month'), moment().endOf('month')],
			'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
		},
		applyButtonClasses: "mdl-button mdl-js-button mdl-button--raised mdl-button--colored",
		cancelClass: "mdl-button mdl-js-button",
		opens: 'left',
		drops: 'up',
		locale: {
			format: 'DD.MM.YYYY'
		}
	}, function (start, end, label) {
		onSet(start.format('DD.MM.YYYY'), end.format('DD.MM.YYYY'));
	});

	onSet(date1, date2);
}

function fullscreen(element) {


	let isInFullScreen = (document.fullscreenElement && document.fullscreenElement !== null) ||
		(document.webkitFullscreenElement && document.webkitFullscreenElement !== null) ||
		(document.mozFullScreenElement && document.mozFullScreenElement !== null) ||
		(document.msFullscreenElement && document.msFullscreenElement !== null);

	let docElm = document.documentElement;
	if (!isInFullScreen) {
		if (docElm.requestFullscreen) {
			docElm.requestFullscreen();
		} else if (docElm.mozRequestFullScreen) {
			docElm.mozRequestFullScreen();
		} else if (docElm.webkitRequestFullScreen) {
			docElm.webkitRequestFullScreen();
		} else if (docElm.msRequestFullscreen) {
			docElm.msRequestFullscreen();
		}
		$(element).addClass("fullScreen");
		$(element).attr("prevStyleSoMeTh1nGUniQue43355", $(element).attr("style"));
		$(element).css({width: "100%", height: "100%", position: "absolute"});


	} else {
		if (document.exitFullscreen) {
			document.exitFullscreen();
		} else if (document.webkitExitFullscreen) {
			document.webkitExitFullscreen();
		} else if (document.mozCancelFullScreen) {
			document.mozCancelFullScreen();
		} else if (document.msExitFullscreen) {
			document.msExitFullscreen();
		}
		$(element).removeClass("fullScreen");
		$(element).attr("style", $(element).attr("prevStyleSoMeTh1nGUniQue43355"));
		$(element).removeAttr("prevStyleSoMeTh1nGUniQue43355");

	}
}