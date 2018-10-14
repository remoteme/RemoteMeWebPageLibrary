class DotPosition {
	constructor(elementId, width, height) {
		this.container = $('#' + elementId);


		this.width = width;
		this.height = height;

		var containerCss = {
			"opacity": "0.5",
			"width": width + "px",
			"height": height + "px",
			"border": "1px solid #bb0014",
			"position": "absolute",
			"right": "0px",
			"top": "0px",
			"overflow": "hidden"
		};

		var dotCss = {
			"position": "relative",
			"top": "0px",
			"left": "0px",
			"width": "10px",
			"height": "10px",
			"border": "1px solid red",
			"background-color": "red",
			"border-radius": "5px"
		};

		var textCss = {
			"position": "relative",
			"top": "0px",
			"left": "0px",
			"font-size": "12pt",
			"line-height": "9pt",
			"margin-top": "-5pt",
			"padding-top": "0px",
			"color": "red",
			"font-family":"Courier New, monospace"
		};
		this.container.css(containerCss);

		this.dot = $("<div></div>");
		this.dot.css(dotCss);
		this.container.append(this.dot);


		this.text = $("<div></div>");
		this.text.css(textCss);
		this.text.html("");
		this.container.append(this.text);



		this.setPosition(0, 0);
	}


	setPosition(x, y) {
		this.dot.css("left", this.width * x- 6 + "px");
		this.dot.css("top", this.height * y - 6 + "px");

		this.text.html(`x=${Math.round(x*200-100)}<br/>y=${Math.round(y*200-100)}`);
	}

}

class TurnMeter {
	setValue(value) {
		this.gauge.value = value;
	}

	constructor(canvasId, width, height) {
		var ticks = [];
		ticks.push("min");
		ticks.push(0);
		ticks.push("max");
		this.gauge = new LinearGauge({
			renderTo: canvasId,
			width: width,
			height: height,
			minValue: -255,
			maxValue: 255,
			majorTicks: ticks,
			minorTicks: 5,
			colorPlate: "#fff",
			borderShadowWidth: 0,
			borders: false,
			barBeginCircle: false,
			tickSide: "left",
			numberSide: "left",
			needleSide: "left",
			needleType: "arrow",
			needleWidth: 12,
			highlights: [],
			colorNeedle: "#dd0031",
			animationDuration: -1,
			animationRule: "linear",
			animationTarget: "plate",
			barWidth: 0,
			ticksWidth: 10,
			ticksWidthMinor: 5
		}).draw();
	}
}

class SpeedMeter {

	setValue(speed) {
		this.gauge.value = speed;
	}

	constructor(canvasId, title, width, height) {
		var ticks = [];
		ticks.push("min");
		for (var i = -200; i <= 200; i += 50) {
			ticks.push(i + "");
		}
		ticks.push("max");
		this.gauge = new RadialGauge({
			renderTo: canvasId,
			width: width,
			height: height,
			units: title,
			minValue: -255,
			maxValue: 255,
			majorTicks: ticks,
			minorTicks: 2,
			strokeTicks: true,
			highlights: [
				{
					"from": 200,
					"to": 255,
					"color": "#dd0031"
				}, {
					"from": 120,
					"to": 200,
					"color": "#FFAD00"
				},
				{
					"from": -255,
					"to": -200,
					"color": "#dd0031"
				}, {
					"from": -200,
					"to": -120,
					"color": "#FFAD00"
				}
			],
			colorPlate: "#fff",
			borderShadowWidth: 0,
			borders: false,
			needleType: "arrow",
			needleWidth: 2,
			needleCircleSize: 7,
			needleCircleOuter: true,
			needleCircleInner: false,
			animationDuration: -1,
			animationRule: "linear"
		}).draw();
	}
}