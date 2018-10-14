var globalTouch;
class Touch{


	addStyle(css){
		var style = document.createElement('style');
		style.type = 'text/css';
		style.innerHTML = css;
		document.getElementsByTagName('head')[0].appendChild(style);

	}
	createDiv(id) {
		jQuery('<div/>', {
			id: id,
			class: 'steer'
		}).appendTo('body');
	}

	constructor(onLeftMove,onRightMove,css) {
		if (css==undefined){
			css='.steer{ position:absolute; opacity: 0.5; width:80px; height:80px; border-radius: 80px; border:1px solid gray; top:calc(100% /2 - 80px)} #leftSteer{left:100px   } #rightSteer{right:100px }';
		}


		this.onLeftMove=onLeftMove;
		this.onRightMove=onRightMove;

		this.addStyle(css);
		this.createDiv("leftSteer");
		this.createDiv("rightSteer");

		this.info("a");
		globalTouch=this;
		$("#out").on('click',function(){$('#out').html("")});
		$(document).on('touchstart',this.touchStart);
		$(document).on('touchend',this.touchEnd);
		$(document).on('touchmove',this.touchmove);
		$(document).on('mouseDown', this.mouseDown);

		this.left={x:0,y:0};
		this.right={x:0,y:0};

		this.leftDelta={x:0,y:0};
		this.rightDelta={x:0,y:0};
	}

	touchStart(e){
		var pos;
		var div;
		if (e.changedTouches[0].pageX<$(document).width()/2){
			globalTouch.left.x=e.changedTouches[0].pageX;
			globalTouch.left.y=e.changedTouches[0].pageY;
			div=$('#leftSteer');
			globalTouch.onLeftChanged(0,0);
		}else{
			globalTouch.right.x=e.changedTouches[0].pageX;
			globalTouch.right.y=e.changedTouches[0].pageY;
			globalTouch.onRightChanged(0,0);
			div=$('#rightSteer');
			globalTouch.rightDelta={x:0,y:0};
		}
		//	div.css('display','block');
		div.css('top',(e.changedTouches[0].pageY-div.height()/2)+"px");
		div.css('left',(e.changedTouches[0].pageX-div.width()/2)+"px");




		globalTouch.info(e.changedTouches[0].pageX);
	}

	touchEnd(e){
		var div;
		if (e.changedTouches[0].pageX<$(document).width()/2){
			globalTouch.info("E left");
			div=$('#leftSteer');
			globalTouch.onLeftChanged(0,0);
		}else{
			globalTouch.info("E right");
			div=$('#rightSteer');
			globalTouch.onRightChanged(0,0);
		}
		globalTouch.info(e.changedTouches[0].pageX);
		//	div.css('display','none');
		div.css('top','');
		div.css('left','');
	}

	touchmove(e){
		e.preventDefault();
		var currentRightDelta={x:globalTouch.rightDelta.x,y:globalTouch.rightDelta.y};


		var currentLeftDelta={x:globalTouch.leftDelta.x,y:globalTouch.leftDelta.y};

		for(var i=0;i<e.changedTouches.length;i++){
			var current={x:e.changedTouches[i].pageX,y:e.changedTouches[i].pageY};

			var left =current.x<($(document).width()/2);



			if (left){
				currentLeftDelta.x=globalTouch.left.x-current.x;
				currentLeftDelta.y=globalTouch.left.y-current.y;
			}else{
				currentRightDelta.x=globalTouch.right.x-current.x;
				currentRightDelta.y=globalTouch.right.y-current.y;
			}
		}


		if (globalTouch.getCartesianDiff(currentLeftDelta,globalTouch.leftDelta)>10){
			globalTouch.onLeftChanged(currentLeftDelta.x,currentLeftDelta.y);
		}

		if (globalTouch.getCartesianDiff(currentRightDelta,globalTouch.rightDelta)>10){
			globalTouch.onRightChanged(currentRightDelta.x,currentRightDelta.y);
		}


	}

	getCartesianDiff(p1,p2){
		return Math.sqrt(Math.pow(p1.x-p2.x,2)+Math.pow(p1.y-p2.y,2))
	}

	onLeftChanged(x,y){
		globalTouch.leftDelta.x=x;
		globalTouch.leftDelta.y=y;

		globalTouch.onLeftMove(x,y);
	}
	onRightChanged(x,y){
		globalTouch.rightDelta.x=x;
		globalTouch.rightDelta.y=y;


		globalTouch.onRightMove(x,y);
	}


	clearInfo(){
		$('#out').html("");
	}

	info(text){

		$('#out').html($('#out').html()+" "+text);
	}
}




