
var id=0;
var otChange= new OperationTimer(200);

$.fn.extend({
	animateCss: function(animationName,infinitive=false, callback) {
		if (this.clean!=undefined){
			this.clean();
		}

		var animationEnd = (function(el) {
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

		var classToAdd = 'animated ' + animationName+(infinitive?' animation-iteration-count: infinite':'');
		this.clean=()=>{
			$(this).removeClass(classToAdd);
			this.clean=undefined;
		};

		this.addClass(classToAdd).one(animationEnd, function() {
			$(this).removeClass(classToAdd);
			if (typeof callback === 'function') callback();
		});

		return this;
	},
});
class Touch{

	constructor(selector,xRange,yRange,onMove) {

		this.onMoveReal=onMove;
		this.xRange=xRange;
		this.yRange=yRange;
		this.move=false;

		this.steerParent=  $(`<div class="steerParent"></div>`);
		this.pointer= $(`<div class="steer" ></div>`);
		this.text= $(`<div class="text" ></div>`);
		this.steerParent.append(this.pointer);
		this.steerParent.append(this.text);

		if ($(selector).attr( "style" )!=undefined){
			this.steerParent.attr("style",$(selector).attr( "style" ));
			$(selector).removeAttr( "style" );
		}

		selector.replaceWith(this.steerParent[0]);

		this.steerParent.touchElement=this;

		var onTouchStart=e=>{
			var touch=e.data;
			touch.move=true;
			var touchEvent=touch.getTouchEvent(e);

			var top=touchEvent.pageY-touch.steerParent.offset().top;
			var left=touchEvent.pageX-touch.steerParent.offset().left;


			touch.deltaOffsetX=touchEvent.clientX;
			touch.deltaOffsetY=touchEvent.clientY;


			touch.steerParent.addClass('active');

			touch.pointer.css('top',top-touch.pointer.height()/2+"px");
			touch.pointer.css('left',left-touch.pointer.width()/2+"px");
			touch.onMove(0,0);
		};



		var onTouchEnd=(e)=>{
			var touch=e.data;
			touch.move=false;

			touch.steerParent.removeClass('active');

			touch.steerParent.css('top','');
			touch.steerParent.css('left','');
			touch.pointer.css('background-color','');

			touch.pointer.css('top',touch.steerParent.height()/2-touch.pointer.height()/2+"px");
			touch.pointer.css('left',touch.steerParent.width()/2-touch.pointer.width()/2+"px");

			touch.onMove(0,0);
		};
		var onTouchMove=e=>{
			e.preventDefault();
			var touch=e.data;

			if (touch.move){
				var touchEvent=touch.getTouchEvent(e);

				var top=touchEvent.pageY-touch.steerParent.offset().top;
				var left=touchEvent.pageX-touch.steerParent.offset().left;

				touch.pointer.css('top',top-touch.pointer.height()/2+"px");
				touch.pointer.css('left',left-touch.pointer.width()/2+"px");

				var xposition=-(touch.deltaOffsetX-touchEvent.clientX)/(touch.steerParent.width()/2);
				var yposition=(touch.deltaOffsetY-touchEvent.clientY)/(touch.steerParent.height()/2);

				xposition=touch.range(xposition);
				yposition=touch.range(yposition);

				touch.onMove(xposition,yposition);
			}


		};


		this.steerParent.on('touchstart',this,onTouchStart);
		this.steerParent.on('mousedown',this,onTouchStart);

		this.steerParent.on('touchend',this,onTouchEnd);
		this.steerParent.on('mouseup',this,onTouchEnd);

		this.steerParent.on('touchmove',this,onTouchMove);
		this.steerParent.on('mousemove',this,onTouchMove);


	}

	onMove(x,y){
		x=Math.round(x*this.xRange);
		y=Math.round(y*this.yRange);

		if (x==0&& y==0){
			this.text.text("");
		}else{
			this.text.text(x+" "+y);
		}

		if (this.onMoveReal!=undefined){
			this.onMoveReal(x,y);
		}
	}
	range(number){
		if (number<-1){
			return -1;
		}else if (number>1){
			return 1;
		}else{
			return number;
		}
	}
	getTouchEvent(e){
		if (e.changedTouches==undefined){//probably mouses
			return e;
		}
		if (e.changedTouches.length==1){
			return e.changedTouches[0];
		}
		for(var i=0;i<e.changedTouches.length;i++){
			if (e.changedTouches[i].target==this.steerParent[0]){
				return e.changedTouches[i];
			}
		}
	}

	toFixes(i){
		return (i>=0?' ':'')+(i/100.0).toFixed(2);
	}

	getCartesianDiff(p1,p2){
		return Math.sqrt(Math.pow(p1.x-p2.x,2)+Math.pow(p1.y-p2.y,2))
	}
}

function readProperties(selector){
	var name = $(selector).attr("name");
	if ($(selector).attr("label") != undefined) {
		label = $(selector).attr("label");
	} else {
		label = name;
	}

	if ($(selector).attr("disabled") != undefined) {
		disabled=true;
	}else{
		disabled=false;
	}

	var min=0;
	var max=100;
	if ($(selector).attr( "min" )!=undefined){
		min=parseInt($(selector).attr( "min" ));
	}
	if ($(selector).attr( "max" )!=undefined){
		max=parseInt($(selector).attr( "max" ));
	}
	var disabled=false;
	disabled =$(selector).attr( "disabled" )!=undefined;

	return {name:name,label:label,disabled:disabled,min:min,max:max,disabled:disabled};


}
function addButton(selector){
	var prop = readProperties(selector);

	var element = $(`<button class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect" ${prop.disabled?'disabled':''}>${prop.label}	</button>`);

	remoteme.getVariables().observeBoolean(prop.name,x=>{
		if (x){
			$(element).addClass("mdl-button--accent");
		}else{
			$(element).removeClass("mdl-button--accent");
		}
	});

	if (!prop.disabled){
		$(element).click(()=>{
			var value=!$(element).hasClass("mdl-button--accent");
			remoteme.getVariables().setBoolean(prop.name,value);
		});
	}

	replaceComponent(selector,element);
	componentHandler.upgradeElement(	element.get()[0]);
}


function addColorChange(selector){

	var max=255;
	if ($(selector).attr( "max" )!=undefined){
		max=$(selector).attr( "max" );
	}
	var mn=max/255;

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
		color:'#000000'
	});

	$(dialog.find('.select').get(0)).click(()=>{
		button.children(".color-badge").css("background-color", colorPicker.color.hexString);

		remoteme.getVariables().setSmallInteger3(prop.name,colorPicker.color.rgb.r*mn,colorPicker.color.rgb.g*mn,colorPicker.color.rgb.b*mn);

		dialog.get()[0].close();
	});

	$(dialog.find('.close').get(0)).click(()=>{

		dialog.get()[0].close();
	});


	componentHandler.upgradeElement(	dialog.get()[0]);

	if (! dialog.get()[0].showModal) {
		dialogPolyfill.registerDialog(get()[0]);
	}





	var button = $(`<button class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect color-badge-parent" ${prop.disabled?'disabled':''}><span  class="color-badge"></span> ${prop.label}	</button>`);

	if (!prop.disabled) {
		$(button).click(() => {
			dialog.get()[0].showModal();
		});
	}


	remoteme.getVariables().observeSmallInteger3(prop.name,(r,g,b)=>{
		r=Math.round(r/mn);
		g=Math.round(g/mn);
		b=Math.round(b/mn);
		if (colorPicker.color!=undefined){
			colorPicker.color.rgb = { r: r, g: g, b: b };
		}

		button.children(".color-badge").css("background-color", `rgb(${r}, ${g}, ${b})`);
	});




	replaceComponent(selector,button);



	$("body").append(dialog);
	componentHandler.upgradeElement(	button.get()[0]);

}

function addCheckBox(selector,switchMode=false){
	var prop = readProperties(selector);

	var temp=id++;
	var checkBoxElement;
	if (switchMode){
		checkBoxElement = $(`<label class="mdl-switch mdl-js-switch mdl-js-ripple-effect" for="switch-${temp}">
			<input type="checkbox" id="switch-${temp}" class="mdl-switch__input" ${prop.disabled?'disabled':''}>
			<span class="mdl-switch__label">${prop.label}</span>
			</label>`);
	}else{
		checkBoxElement = $(`
		<label class="mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect" for="checkbox-${temp}">
		  <input type="checkbox" id="checkbox-${temp}" class="mdl-checkbox__input" ${prop.disabled?'disabled':''}>
		  <span class="mdl-checkbox__label">${prop.label}</span>
		</label>
	`);
	}




	var checkbox=checkBoxElement.find("input");


	checkbox.change(function() {
		remoteme.getVariables().setBoolean(prop.name,!checkBoxElement.is('.is-checked'));

	});

	remoteme.getVariables().observeBoolean(prop.name,x=>{
		if (switchMode){
			if (x){
				checkBoxElement.get()[0].MaterialSwitch.on();
			}else{
				checkBoxElement.get()[0].MaterialSwitch.off();
			}
		}else{
			if (x){
				checkBoxElement.get()[0].MaterialCheckbox.check();
			}else{
				checkBoxElement.get()[0].MaterialCheckbox.uncheck();
			}

		}

	});


	replaceComponent(selector,checkBoxElement);

	componentHandler.upgradeElement(checkBoxElement[0]);
}


function addSlider(selector,switchMode=false){

	var prop=readProperties(selector);

	var slider = $(`<input class="mdl-slider mdl-js-slider" type="range"
	min="${prop.min}" max="${prop.max}" value="0" tabindex="0" ${prop.disabled?'disabled':''}>`);


	slider.on('input',function() {
		otChange.execute(()=>{
			remoteme.getVariables().setInteger(prop.name,slider.val());
		});

	});

	remoteme.getVariables().observeInteger(prop.name,x=>{
		slider.val(x);

	});

	var box= $(`<div><p>${prop.label}</p></div>`);
	box.append(slider);

	replaceComponent(selector,box);

	componentHandler.upgradeElement(slider.get()[0]);
}

function add3Sliders(selector){




	var prop = readProperties(selector);

	var box= $(`<div class="box"><p>${prop.label}</p></div>`);
	var sliders=[];


	sliders[0] = $(`<input class="mdl-slider mdl-js-slider" type="range" min="${prop.min}" max="${prop.max}" value="0" tabindex="0" ${prop.disabled?'disabled':''}>`);
	sliders[1] = $(`<input class="mdl-slider mdl-js-slider" type="range" min="${prop.min}" max="${prop.max}" value="0" tabindex="0" ${prop.disabled?'disabled':''}>`);
	sliders[2] = $(`<input class="mdl-slider mdl-js-slider" type="range" min="${prop.min}" max="${prop.max}" value="0" tabindex="0" ${prop.disabled?'disabled':''}>`);



	var onChange =(()=> {
		otChange.execute(()=>{
			remoteme.getVariables().setSmallInteger3(prop.name,sliders[0].val(),sliders[1].val(),sliders[2].val());
		});

	});


	for(var i=0;i<3;i++){
		box.append(sliders[i]);
		sliders[i].on('input',onChange);
	}




	remoteme.getVariables().observeSmallInteger3(prop.name,(x1,x2,x3)=>{
		sliders[0].val(x1);
		sliders[1].val(x2);
		sliders[2].val(x3);
	});




	replaceComponent(selector,box);


	for(var i=0;i<3;i++){
		componentHandler.upgradeElement(	sliders[i].get()[0]);

	}
}

function add2Sliders(selector){


	var prop = readProperties(selector);


	var box= $(`<div class="box"><p>${prop.label}</p></div>`);
	var sliders=[];


	sliders[0] = $(`<input class="mdl-slider mdl-js-slider" type="range" min="${prop.min}" max="${prop.max}" value="0" tabindex="0" ${prop.disabled?'disabled':''}>`);
	sliders[1] = $(`<input class="mdl-slider mdl-js-slider" type="range" min="${prop.min}" max="${prop.max}" value="0" tabindex="0" ${prop.disabled?'disabled':''}>`);



	var onChange =(()=> {
		otChange.execute(()=>{
			remoteme.getVariables().setSmallInteger2(prop.name,sliders[0].val(),sliders[1].val());
		});

	});


	for(var i=0;i<2;i++){
		box.append(sliders[i]);
		sliders[i].on('input',onChange);
	}




	remoteme.getVariables().observeSmallInteger2(prop.name,(x1,x2)=>{
		sliders[0].val(x1);
		sliders[1].val(x2);
	});


	replaceComponent(selector,box);


	for(var i=0;i<2;i++){
		componentHandler.upgradeElement(sliders[i].get()[0]);

	}
}


function addGauge(selector){


	var prop = readProperties(selector);


	var widthheight=$(selector).attr( "widthheight" );

	var borders=$(selector).attr( "borders" )=="true";
	var valueBox=$(selector).attr( "valueBox" )=="true";

	var majorTick=parseInt($(selector).attr( "tickDelta" ));
	var minorTick=parseInt($(selector).attr( "minorTick" ));

	var ticks=[];

	if (majorTick>0){
		for(var val=prop.min;val<=prop.max;val+=majorTick){
			ticks.push(val);
		}
	}


	widthheight=widthheight+"px";

	var canvas= $(`<canvas ></canvas>`);

	replaceComponent(selector,canvas);

	var gauge = new RadialGauge({
		renderTo: canvas.get()[0],
		width: widthheight,
		height: widthheight,
		units: label,
		minValue: prop.min,
		maxValue: prop.max,
		majorTicks:  ticks,
		minorTicks: minorTick,
		strokeTicks: true,
		highlights: [

		],
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



	remoteme.getVariables().observeInteger(prop.name,x=>{
		gauge.value=x;

	});
	$(canvas).css(`width:${widthheight};height:${widthheight},font-size:10px`)

}
function addList(selector,variableType){

	var prop = readProperties(selector);


	var temp=id++;
	var element= $(`<div class="mdl-textfield mdl-js-textfield getmdl-select ${prop.disabled?'disabled':''}">
			<input type="text" value="" class="mdl-textfield__input" id="select${temp}" readonly>
			<input type="hidden" value="" name="select${temp}" class="value">
			<i class="mdl-icon-toggle__label material-icons">keyboard_arrow_down</i>
			<label for="select${temp}" class="mdl-textfield__label">${prop.label}</label>
			<ul for="select${temp}" class="mdl-menu mdl-menu--bottom-left mdl-js-menu" >
				
			</ul>
		</div>`);

	var ul=element.find('ul').get(0);
	if (prop.disabled){
		$(ul).css("display","none");
	}

	var toInsert = $(selector).find("option");
	for(var i=0;i<toInsert.length;i++){
		var label=$(toInsert[i]).html();
		var val=$(toInsert[i]).attr('value');
		console.log(label+" "+val);
		toInsert.remove();
		$(ul).append($(`<li class="mdl-menu__item" data-val="${val}">${label}</li>`));
	}
	element.get()[0].disabled=prop.disabled;

	element.get()[0].onChange=(val)=>{
		remoteme.getVariables().set(prop.name,variableType,[val]);
	};



	remoteme.getVariables().observe(prop.name,variableType,x=>{
		element.get()[0].set(x);
	});





	replaceComponent(selector,element);

	getmdlSelect.init(element[0]);

}


function addRadios(selector,variableType) {


	var prop = readProperties(selector);



	var box = $(`<div class="box"><p>${prop.label}</p></div>`);
	var radios = [];


	var temp=id++;
	var toInsert = $(selector).find("option");
	var elements=[];
	for(var i=0;i<toInsert.length;i++){
		var label=$(toInsert[i]).html();
		var val=$(toInsert[i]).attr('value');

		toInsert.remove();

		var toInsertElement = $(`<label class="mdl-radio mdl-js-radio mdl-js-ripple-effect" for="${temp}-option-${val}" >
					  <input type="radio" id="${temp}-option-${val}" class="mdl-radio__button" name="options${temp}" value="${val}" ${prop.disabled?'disabled':''}>
					  <span class="mdl-radio__label">${label}</span>
					</label>`);

		var checkboxZ=toInsertElement.find("input");

		checkboxZ.change(function(s) {
			remoteme.getVariables().set(prop.name,variableType,[$(s.currentTarget).attr("value")]);
		});
		box.append(toInsertElement);
		elements[val]=(toInsertElement);


	}


	remoteme.getVariables().observe(prop.name,variableType,x=>{
		if (elements[x]!=undefined){
			$(elements[x])[0].MaterialRadio.check();
		}
	});



	replaceComponent(selector,box);

}

function replaceComponent(selector,element){
	if ($(selector).attr( "style" )!=undefined){
		$(element).attr("style",$(selector).attr( "style" ));
	}
	if ($(selector).attr( "class" )!=undefined){
		$(element).addClass( $(selector).attr("class") );
	}

	$(selector).replaceWith(element);



}
function addTextField(selector,variableType) {



	var prop = readProperties(selector);

	var label;


	var temp=id++;

	var pattern=undefined;

	if (variableType==VariableOberverType.INTEGER){
		pattern="-?[0-9]*"
	}else if (variableType==VariableOberverType.DOUBLE){
		pattern="-?[0-9]*(\.[0-9]+)?"
	}else {
		pattern="*."
	}

	var textField = $(`<div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label textWithApply ${prop.disabled?'disabled':''}">
			<input class="mdl-textfield__input" type="text" id="textField-${temp}" pattern="${pattern}" ${prop.disabled?'disabled':''}>
			<label class="material-icons" for="textField-${temp}">publish</label>
			<label class="mdl-textfield__label" for="textField-${temp}">${prop.label}</label>
		</div>`);



	var input = $(textField).find("input");
	var button = $(textField).find(".material-icons");

	input.keypress(function (e) {
		if (e.which == 13) {
			remoteme.getVariables().set(prop.name,variableType,[input[0].value]);
			return false;
		}
	});

	button.click(()=>{
		remoteme.getVariables().set(prop.name,variableType,[input[0].value]);
	});


	remoteme.getVariables().observe(prop.name,variableType,x=>{
		textField[0].MaterialTextfield.change(x);
		textField.removeClass("is-upgraded");
	});



	replaceComponent(selector,textField);

}

function addJoystick(selector){

	var prop=readProperties(selector);



	var xRange=100;
	var yRange=100;
	if ($(selector).attr( "xRange" )!=undefined){
		xRange=$(selector).attr( "xRange" );
	}


	if ($(selector).attr( "yRange" )!=undefined){
		yRange=$(selector).attr( "yRange" );
	}

	var touch=new Touch(selector,xRange,yRange,(x,y)=>{
		console.info(x+" "+y);
		otChange.executeWithId(prop.name+"SmallInteger2",()=>{
			remoteme.getVariables().setSmallInteger2(prop.name,x,y);
		});

	});



}

function getOnConnectionChange(cnt,icon){
	return (status)=>{
		cnt.removeClass();
		if (status==ConnectingStatusEnum.CONNECTING){
			icon.addClass("connecting");
			icon.animateCss("pulseMore",true);
		}else if (status==ConnectingStatusEnum.CONNECTED){
			cnt.addClass("connected");
			icon.animateCss("rubberBandMore");
		}else if (status==ConnectingStatusEnum.DISCONNECTED){
			cnt.addClass("disconnected");
			icon.animateCss("zoomOut");
		}else if (status==ConnectingStatusEnum.FAILED){
			cnt.addClass("failed");
			icon.animateCss("shake");
		}else if (status==ConnectingStatusEnum.DISCONNECTING){
			cnt.addClass("disconnecting");
			icon.animateCss("pulseMore",true);
		}else if (status==ConnectingStatusEnum.CHECKING){
			cnt.addClass("checking");
			iicon.animateCss("pulseMore",true);
		}
	}
}
function addconnectionStatus(selector){


	let webSocket=false;
	let directConnection=false;
	let camera=false;

	if ($(selector).attr("webSocket") != undefined) {
		webSocket=$(selector).attr("webSocket") =="true";
	}

	if ($(selector).attr("directConnection") != undefined) {
		directConnection=$(selector).attr("directConnection") =="true";
	}

	if ($(selector).attr("camera") != undefined) {
		camera=$(selector).attr("camera") =="true";
	}


	var box= $(`<div class='statusIcons'></div>`);

	if (webSocket){

		let icon =$(`<i class='material-icons'>cloud_done</i>`);
		let cnt =$(`<div class='disconnected'></div>`);
		icon.click(remoteme.onOffWebSocket.bind(remoteme));
		cnt.append(icon);
		box.append(cnt);
		remoteme.remoteMeConfig.webSocketConnectionChange.push(getOnConnectionChange(cnt,icon));
	}

	if (directConnection){
		let icon =$(`<i class='material-icons'>link</i>`);
		let cnt =$(`<div class='disconnected'></div>`);
		icon.click(remoteme.onOffDirectConnection.bind(remoteme));

		cnt.append(icon);
		box.append(cnt);
		remoteme.remoteMeConfig.directConnectionChange.push(getOnConnectionChange(cnt,icon));
	}

	if (camera){

		let icon =$(`<i class='material-icons'>videocam</i>`);
		let cnt =$(`<div class='disconnected'></div>`);
		icon.click(remoteme.onOffWebRTC.bind(remoteme));

		cnt.append(icon);
		box.append(cnt);
		remoteme.remoteMeConfig.webRtcConnectionChange.push(getOnConnectionChange(cnt,icon));
	}


	replaceComponent(selector,box);


}

function replace(){
	var variables=$("variable");
	var connectionStatus=$("connectionstatus");
	for(let i=0;i<connectionStatus.length;i++){
		addconnectionStatus(connectionStatus[i]);
	}
	for(let i=0;i<variables.length;i++){
		variable=variables[i];
		if ($(variable).attr( "type" ) =="BOOLEAN" && $(variable).attr( "component" ) =="button"){
			addButton(variable);
		}else if ($(variable).attr( "type" ) =="BOOLEAN" && $(variable).attr( "component" ) =="checkbox"){
			addCheckBox(variable);
		}else if ($(variable).attr( "type" ) =="BOOLEAN" && $(variable).attr( "component" ) =="switcher"){
			addCheckBox(variable,true);
		}
		else if ($(variable).attr( "type" ) =="INTEGER" && $(variable).attr( "component" ) =="slider"){
			addSlider(variable);
		}else if ($(variable).attr( "type" ) =="SMALL_INTEGER_3" && $(variable).attr( "component" ) =="slider"){
			add3Sliders(variable);
		}else if ($(variable).attr( "type" ) =="SMALL_INTEGER_2" && $(variable).attr( "component" ) =="slider"){
			add2Sliders(variable);
		}
		else if ($(variable).attr( "type" ) =="INTEGER" && $(variable).attr( "component" ) =="gauge"){
			addGauge(variable);
		}

		else if ($(variable).attr( "type" ) =="INTEGER" && $(variable).attr( "component" ) =="dropDownList"){
			addList(variable,VariableOberverType.INTEGER);
		}else if ($(variable).attr( "type" ) =="TEXT" && $(variable).attr( "component" ) =="dropDownList"){
			addList(variable,VariableOberverType.TEXT);
		}else if ($(variable).attr( "type" ) =="DOUBLE" && $(variable).attr( "component" ) =="dropDownList"){
			addList(variable,VariableOberverType.DOUBLE);
		}

		else if ($(variable).attr( "type" ) =="INTEGER" && $(variable).attr( "component" ) =="radio"){
			addRadios(variable,VariableOberverType.INTEGER);
		}else if ($(variable).attr( "type" ) =="TEXT" && $(variable).attr( "component" ) =="radio"){
			addRadios(variable,VariableOberverType.TEXT);
		}else if ($(variable).attr( "type" ) =="DOUBLE" && $(variable).attr( "component" ) =="radio"){
			addRadios(variable,VariableOberverType.DOUBLE);
		}


		else if ($(variable).attr( "type" ) =="INTEGER" && $(variable).attr( "component" ) =="textField"){
			addTextField(variable,VariableOberverType.INTEGER);
		}else if ($(variable).attr( "type" ) =="TEXT" && $(variable).attr( "component" ) =="textField"){
			addTextField(variable,VariableOberverType.TEXT);
		}else if ($(variable).attr( "type" ) =="DOUBLE" && $(variable).attr( "component" ) =="textField"){
			addTextField(variable,VariableOberverType.DOUBLE);
		}

		else if ($(variable).attr( "type" ) =="SMALL_INTEGER_3" && $(variable).attr( "component" ) =="color"){
			addColorChange(variable);
		}

		else if ($(variable).attr( "type" ) =="SMALL_INTEGER_2" && $(variable).attr( "component" ) =="joystick"){
			addJoystick(variable);
		}
	}
}

$( document ).ready(function() {
	if (RemoteMe.thiz==undefined){
		remoteme = new RemoteMe();
		remoteme.directWebSocketConnectionConnect();
	}
	replace();
	if (typeof doNotCreateRemoteMe  !== 'undefined' && doNotCreateRemoteMe==true){
		remoteme.sendDirectWebsocket=()=>{};
		remoteme.sendRest=()=>{};
		remoteme.sendWebSocketText=()=>{};
		remoteme.sendWebRtc=()=>{};
		remoteme.sendWebSocket=()=>{};
		remoteme.directWebSocketConnectionConnect=()=>{};
		remoteme.connectWebSocket=()=>{};

	}

});

function addDatePickerForChart(id,date1,date2,onSet){
	$(`#${id}`).daterangepicker({
		startDate:date1,
		endDate:date2,

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
	}, function(start, end, label) {
		onSet(start.format('DD.MM.YYYY'),end.format('DD.MM.YYYY'));
	});

	onSet(date1,date2);
}